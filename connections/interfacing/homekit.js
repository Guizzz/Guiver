const hap = require("hap-nodejs");
const Link_manager = require("../utils/link_manager");

const Accessory = hap.Accessory;
const Characteristic = hap.Characteristic;
const CharacteristicEventTypes = hap.CharacteristicEventTypes;
const Service = hap.Service;

class Homekit_Server
{   
    constructor()
    {
        this.link_manager = new Link_manager("HOMEKIT_SERVER", "homekit_queue");
        this.link_manager.start();
        // this.link_manager.on("msg", this.update_value.bind(this));
        this.link_manager.on("channel_new", this._start.bind(this));

        this.accessoryUuid = hap.uuid.generate("hap.examples.light");
        this.accessory = new Accessory("Test luce Apple Home", this.accessoryUuid);

        this.lightService = new Service.Lightbulb("Lightbulb Test");

        this.currentLightState = false; // on or off
        this.currentBrightnessLevel = 100;
        this.onCharacteristic = this.lightService.getCharacteristic(Characteristic.On);
        this.onCharacteristic.on(CharacteristicEventTypes.GET, this._get.bind(this));
        this.onCharacteristic.on(CharacteristicEventTypes.SET, this._set.bind(this));

        this.accessory.addService(this.lightService);
        // accessory.addService(test); // adding the service to the accessory

        // once everything is set up, we publish the accessory. Publish should always be the last step!
        this.accessory.publish({
        username: "17:51:07:F4:BC:8A",
        pincode: "678-90-876",
        port: 47129,
        category: hap.Categories.LIGHTBULB, // value here defines the symbol shown in the pairing screen
        });

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
    }

    // with the 'on' function we can add event handlers for different events, mainly the 'get' and 'set' event
    _get( callback) {
        console.log("Queried current light state: " + this.currentLightState);
        callback(undefined, this.currentLightState);
    }
    _set(value, callback) {
        console.log("Setting light state to: " + value);
        this.currentLightState = value;
        var j_cmd = {
            "type": "request",
            "command": "rainbow_start",
            "payload" :{
                "time": 40,
                "brightnes":254
            }
        }

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        callback();
    }
}
module.exports = Homekit_Server;