'use strict';

var Service;
var Characteristic;
var request = require('request');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-switcheroo', 'Switcheroo', Switcheroo);
};

function Switcheroo(log, config) {
    this.log = log;

    this.name            = config.name             || 'Switcheroo Switch';
    this.switchType      = config.switch_type;           
    this.baseUrl         = config.base_url;
    this.httpMethod      = config.http_method      || 'GET';

    this.username        = config.username         || '';
    this.password        = config.password         || '';
    this.sendImmediately = config.send_immediately || '';

    switch (this.switchType) {
        case 'Switch':
            this.onUrl   = this.baseUrl + config.on_url;
            this.offUrl  = this.baseUrl + config.off_url;
            this.onBody  = config.on_body  || '';
            this.offBody = config.off_body || '';
            break;

        case 'Multiswitch':
            this.multiswitch = config.multiswitch;
            break;

        default:
            throw new Error('Unknown homebridge-switcheroo switch type');
    }
}

Switcheroo.prototype = {

    httpRequest: function(url, body, method, username, password, sendimmediately, callback) {
        request({
            url: url,
            body: body,
            method: method,
            rejectUnauthorized: false,
            auth: {
                user: username,
                pass: password,
                sendImmediately: sendimmediately
            }
        },
        function(error, response, body) {
            callback(error, response, body);
        });
    },

    setPowerState: function(targetService, powerState, callback, context) {
        var funcContext = 'fromSetPowerState';
        var reqUrl = '', reqBody = '';

        // Callback safety
        if (context == funcContext) {
            if (callback) {
                callback();
            }

            return;
        }

        switch(this.switchType) {
            case 'Switch':
                if (!this.onUrl || !this.offUrl) {
                    this.log.warn('Ignoring request; No power state urls defined.');
                    callback(new Error('No power state urls defined.'));
                    return;
                }

                reqUrl  = powerState ? this.onUrl  : this.offUrl;
                reqBody = powerState ? this.onBody : this.offBody;
                break;

            case 'Multiswitch':
                this.services.forEach(function (switchService, idx) {
                    if (idx === 0) {
                        // Don't check the informationService which is at idx=0
                        return;
                    }

                    if (targetService.subtype === switchService.subtype) {
                        reqUrl = this.baseUrl + '/' + idx;
                    } else {
                        switchService.getCharacteristic(Characteristic.On).setValue(false, undefined, funcContext);
                    }
                }.bind(this));
                break;

            default:
                this.log('Unknown homebridge-switcheroo type in setPowerState');
        }

        this.httpRequest(reqUrl, reqBody, this.httpMethod, this.username, this.password, this.sendImmediately, function(error, response, responseBody) {
            if (error) {
                this.log.error('setPowerState failed: ' + error.message);
                this.log('response: ' + response + '\nbody: ' + responseBody);
            
                callback(error);
            } else {
                switch (this.switchType) {
                    case 'Switch':
                        this.log.info('==> ' + (powerState ? "On" : "Off"));
                        break;
                    case 'Multiswitch':
                        this.log('==> ' + targetService.subtype);
                        break;
                    default:
                        this.log.error('Unknown switchType in request callback');
                }

                callback();
            }
        }.bind(this));
    },

    identify: function (callback) {
        this.log('Identify me Senpai!');
        callback();
    },

    getServices: function () {
        this.services = [];

        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Switcheroo')
            .setCharacteristic(Characteristic.Model, 'Switcheroo');
        this.services.push(informationService);

        switch (this.switchType) {
            case 'Switch':
                this.log('(switch)');

                var switchService = new Service.Switch(this.name);
                switchService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setPowerState.bind(this, switchService));

                this.services.push(switchService);

                break;
            case 'Multiswitch':
                this.log('(multiswitch)');

                for (var i = 0; i < this.multiswitch.length; i++) {
                    var switchName = this.multiswitch[i];

                    switch(i) {
                        case 0:
                            this.log.warn('---+--- ' + switchName); break;
                        case this.multiswitch.length-1:
                            this.log.warn('   +--- ' + switchName); break;
                        default:
                            this.log.warn('   |--- ' + switchName);
                    }

                    var switchService = new Service.Switch(switchName, switchName);

                    // Bind a copy of the setPowerState function that sets 'this' to the accessory and the first parameter
                    // to the particular service that it is being called for. 
                    var boundSetPowerState = this.setPowerState.bind(this, switchService);
                    switchService
                        .getCharacteristic(Characteristic.On)
                        .on('set', boundSetPowerState);

                    this.services.push(switchService);
                }

                break;
            default:
                this.log('Unknown homebridge-switcheroo type in getServices');
        }
        
        return this.services;
    }
};