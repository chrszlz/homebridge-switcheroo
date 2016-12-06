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

    this.name            = config.name            || 'Switcheroo Switch';
    this.switchType      = config.service;           
    this.baseUrl         = config.base_url;
    this.httpMethod      = config.http_method     || 'GET';

    this.username        = config.username        || '';
    this.password        = config.password        || '';
    this.sendImmediately = config.sendimmediately || '';

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

    // getPowerState: function (callback) {
    //     self = this;
    //     request(this.http_method, url, function(error, response, responseBody) {
    //         if (error) {
    //             this.log('HTTP get power function failed: %s', error.message);
    //             callback(error);
    //         } else {
    //             this.log('HTTP get power function succeeded!');
    //             var info = JSON.parse(response.body);
    //             this.log(response.body);
    //             this.log(info);

    //             var binaryState = parseInt(responseBody);
    //             this.log('Power state is currently %s', binaryState);
    //             var isPowerOn = binaryState > 0;
    //             callback(null, isPowerOn);
    //         }
    //     }.bind(this));
    // },

    // TODO: Actually write this
    // getPowerState: function (callback) {
    //     callback(null, false);
    // },

    setPowerState: function(targetService, powerState, callback, context) {
        var funcContext = 'fromSetPowerState';
        var reqUrl = '', reqBody = '';

        // Callback s.o. safety
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
                this.log('switching to input: ' + targetService.subtype);

                this.services.forEach(function (switchService, idx) {
                    // if (idx === 0) {
                    //     // Don't check the informationService which is at idx=0
                    //     return;
                    // }

                    this.log('  [' + (idx + 1) + '] - ' + switchService.subtype);

                    if (targetService.subtype === switchService.subtype) {
                        reqUrl = '' + this.baseUrl + '/%s', (idx + 1);
                        this.log.warn('setPowerState if: ' + reqUrl); 
                    } else {
                        switchService.getCharacteristic(Characteristic.On).setValue(false, undefined, funcContext);
                    }
                }.bind(this));
                break;

            default:
                this.log('Unknown homebridge-switcheroo type in setPowerState');
        }

        this.log('request url: ' + reqUrl);

        this.httpRequest(reqUrl, reqBody, this.httpMethod, this.username, this.password, this.sendImmediately, function(error, response, responseBody) {
            if (error) {
                this.log.error('setPowerState failed: ' + error.message);
                this.log('response: ' + response + '\nbody: ' + responseBody);
            
                callback(error);
            } else {
                switch (this.switchType) {
                    case 'Switch':
                        this.log.info('power_state: ' + powerState);
                        break;
                    case 'Multiswitch':
                        this.log.info('input: ' + targetService.subtype);
                        break;
                    default:
                        this.log.error('Unknown switchType in request callback');
                }

                callback();
            }
        }.bind(this));
    },

    identify: function (callback) {
        this.log('Identify requested!');
        callback();
    },

    getServices: function () {
        this.services = [];

        // var informationService = new Service.AccessoryInformation();
        // informationService
        //     .setCharacteristic(Characteristic.Manufacturer, 'E-SDS')
        //     .setCharacteristic(Characteristic.Model, 'UHD 5x1 HDMI Switch');
        // this.services.push(informationService);

        switch (this.switchType) {
            case 'Switch':
                this.log('(switch)');

                var switchService = new Service.Switch(this.name);
                switchService
                    .getCharacteristic(Characteristic.On)
                    // .on('get', this.getPowerState.bind(this))
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