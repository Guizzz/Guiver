const hap = require("hap-nodejs");
const Link_manager = require("../utils/link_manager");
const { interfaceLogger } = require('../utils/logger');

const Accessory = hap.Accessory;
const Characteristic = hap.Characteristic;
const CharacteristicEventTypes = hap.CharacteristicEventTypes;
const Service = hap.Service;

class Homekit_Server
{   
    constructor()
    {
        this.logger = interfaceLogger("WSS_CLIENTS");
        this.link_manager = new Link_manager("HOMEKIT_SERVER", "homekit_queue", (m) => this.logger.debug(m) );
        this.link_manager.start();
        this.link_manager.on("msg", this.update_value.bind(this));
        this.link_manager.on("channel_new", this._start.bind(this));
        
        this.lightService = new Service.Lightbulb("Lightbulb Test");

        this.tempService = new Service.TemperatureSensor("Temp Test");
        this.onCharacteristic_temp = this.tempService.getCharacteristic(Characteristic.CurrentTemperature);
        this.onCharacteristic_temp.on(CharacteristicEventTypes.GET, this._getTemp.bind(this));

        
        this.onCharacteristic_onoff = this.lightService.getCharacteristic(Characteristic.On);
        this.onCharacteristic_onoff.on(CharacteristicEventTypes.GET, this._get.bind(this));
        this.onCharacteristic_onoff.on(CharacteristicEventTypes.SET, this._set.bind(this));
        
        // this.onCharacteristic_brightness = this.lightService.getCharacteristic(Characteristic.Brightness);
        // this.onCharacteristic_brightness.on(CharacteristicEventTypes.SET, this._set_brightness.bind(this));
        
        this.accessoryUuid = hap.uuid.generate("hap.examples.light");
        this.accessory = new Accessory("Test luce Apple Home", this.accessoryUuid);
        this.accessory.addService(this.lightService);
        
        this.accessoryUuid_2 = hap.uuid.generate("hap.examples.temp");
        this.tempAccessory = new Accessory("Apple Home Temp", this.accessoryUuid_2);
        this.tempAccessory.addService(this.tempService);
        
        // once everything is set up, we publish the accessory. Publish should always be the last step!
        this.accessory.publish({
            username: "17:51:07:F4:BC:8A",
            pincode: "678-90-876",
            port: 47129,
            category: hap.Categories.LIGHTBULB, // value here defines the symbol shown in the pairing screen
        });


        this.tempAccessory.publish({
            username: "17:51:07:F4:BC:8B", // diverso!
            pincode: "678-90-876",
            port: 47130, // diverso!
            category: hap.Categories.SENSOR,
        });
        
        this.currentLightStatus = false; // on or off
        this.currentTemperature = 0;
        
        console.log("Accessory setup finished!");
    }

    _start()
    {
        var j_msg = {
            "type": "managment",
            "command": "response_config",
            "module": "HOMEKIT_SERVER",
            "module_queue": "homekit_queue",
        }
        this.link_manager.to_core("core_queue", JSON.stringify(j_msg));

        var j_cmd = {
            "type": "request",
            "command": "relay_status"
        }
        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
    }

    update_value(data)
    {
        this.last = data;
        data = JSON.parse(data);
        if(!data.hasOwnProperty("payload"))
            return;
        if(data.payload.hasOwnProperty("light"))
            this.currentLightStatus = data.payload.light;

        if(data.payload.hasOwnProperty("temp")) {
            this.currentTemperature = data.payload.temp;
            // aggiorna HomeKit
            this.onCharacteristic_temp.updateValue(this.currentTemperature);
        }

    }

    _get( callback) {
        console.log("Queried current light state: " + this.currentLightStatus);
        callback(undefined, this.currentLightStatus);
    }

    _set(value, callback) {
        console.log("Setting light state to: " + value);
        this.currentLightStatus = value;
        let j_cmd = {
            "type": "request",
            "command": "set_relay",
            "payload" : {
                "set_relay": value,
                "relay": "light",
            }
        };
        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        callback();
    }

    _getTemp(callback) {
        
        var j_cmd = {
            "type": "request",
            "command": "get_room_temp"
        }
        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));

        console.log("Queried current temperature: " + this.currentTemperature);
        callback(null, this.currentTemperature);
    }

}
module.exports = Homekit_Server;