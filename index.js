"use strict";

var Service;
var Characteristic;
var request = require("sync-request");

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-switcheroo", "Switcheroo", Switcheroo);
};

function Switcheroo(log, config) {
    this.log = log;

    this.name          = config.name;
    this.accessoryType = config.service;
    this.baseUrl       = config.base_url;
    this.http_method   = config.http_method;
    this.onBody        = config.on_body;
    this.offBody       = config.off_body;

    switch (this.accessoryType) {
        case "Switch":
            this.onUrl  = this.baseUrl + config.on_url;
            this.offUrl = this.baseUrl + config.off_url;
            break;

        case "Multiswitch":
            this.multiswitch = config.multiswitch;
            break;

        default:
            throw new Error("Unknown homebridge-switcheroo accessory type");
    }
}

Switcheroo.prototype = {

    httpRequest: function (url, body, method, username, password, callback) {
        request({
                    url: url,
                    body: body,
                    method: method,
                    rejectUnauthorized: false
                },
                function (error, response, body) {
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
    //             this.log("Power state is currently %s", binaryState);
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
        var funcContext = "fromSetPowerState";
        var reqUrl;

        // Callback s.o. safety
        if (context == funcContext) {
            if (callback) {
                callback();
            }

            return;
        }

        switch(this.accessoryType) {
            case "Switch":
                if (!this.onUrl || !this.offUrl) {
                    this.log.warn("Ignoring request; No power url defined.");
                    callback(new Error("No power url defined."));
                    return;
                }

                reqUrl = powerState ? this.onUrl : this.offUrl;
                break;

            case "Multiswitch":
                this.log('switching to input: ' + targetService.subtype);

                this.services.forEach(function (switchService, idx) {
                    if (idx === 0) {
                        // Don't check the informationService which is at idx=0
                        continue;
                    }

                    if (targetService.subtype === switchService.subtype) {
                        reqUrl = '' + this.baseUrl + '/' + (idx + 1);
                        this.log.warn("setPowerState if: " + reqUrl); 
                    } else {
                        switchService.getCharacteristic(Characteristic.On).setValue(false, undefined, funcContext);
                    }
                }.bind(this));
                break;

            default:
                this.log("Unknown homebridge-switcheroo type in setPowerState");
        }

        this.log("request url: " + reqUrl);

        request(this.http_method, reqUrl, function(error, response, responseBody) {
            if (error) {
                switch (this.accessoryType) {
                    case "Switch":
                        this.log.error('setPowerState failed: ' + error.message);
                        break;
                    case "Multiswitch":
                        this.log.error('setPowerState failed: ' + error.message);
                        break;
                    default:
                        this.log.error('Unknown accessoryType in request callback');
                };

                callback(error);
            } else {
                switch (this.accessoryType) {
                    case "Switch":
                        this.log.info('power_state: ' + powerState);
                        break;
                    case "Multiswitch":
                        this.log.info('input: ' + targetService.subtype);
                        break;
                    default:
                        this.log.error('Unknown accessoryType in request callback');
                };

                callback();
            }
        }.bind(this));
    },

    identify: function (callback) {
        this.log("Identify requested!");
        callback();
    },

    getServices: function () {
        this.services = [];

        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "E-SDS")
            .setCharacteristic(Characteristic.Model, "UHD 5x1 HDMI Switch");
        this.services.push(informationService);

        switch (this.accessoryType) {
            case "Switch":
                this.log("Initializing switch: " + this.name);

                var switchService = new Service.Switch(this.name);
                switchService
                    .getCharacteristic(Characteristic.On)
                    // .on('get', this.getPowerState.bind(this))
                    .on('set', this.setPowerState.bind(this, switchService));

                this.services.push(switchService);

                break;
            case "Multiswitch":
                this.log("Initializing multiswitch:");

                for (var i = 0; i < this.multiswitch.length; i++) {
                    var switchName = this.multiswitch[i];
                    this.log("   |--- " + switchName);

                    var switchService = new Service.Switch(switchName, switchName);

                    // Bind a copy of the setPowerState function that sets "this" to the accessory and the first parameter
                    // to the particular service that it is being called for. 
                    var boundSetPowerState = this.setPowerState.bind(this, switchService);
                    switchService
                        .getCharacteristic(Characteristic.On)
                        .on('set', boundSetPowerState);

                    this.services.push(switchService);
                }

                break;
            default:
                this.log("Unknown homebridge-switcheroo type in getServices");
        }
        
        return this.services;
    }
};