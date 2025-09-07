const Module = require("./module");
var Gpio = null;

try
{
    Gpio = require('pigpio').Gpio;
}
catch
{
    console.log("ERORE")
}

var REALAY_PIN = 2;

class Relay_module extends Module
{
    constructor()
    {
        super("RELAY_MODULE", "relay_queue");
        this.set_handled_cmds({
            "light_on": this.light_on.bind(this),
            "light_off": this.light_off.bind(this),
            "relay_status": this.light_off.bind(this)
        });
        this._init_pin();
    }
    _init_pin()
    {
        this.main_light_status=0;
        this.main_light = new Gpio(REALAY_PIN, {mode: Gpio.OUTPUT});
        this.main_light.digitalWrite(this.main_light_status,10);
    }

    light_on() {
        this.main_light_status=1;
        this.main_light.digitalWrite(this.main_light_status,10);
        return this.relay_status();
    }

    light_off() {
        this.main_light_status=0;
        this.main_light.digitalWrite(this.main_light_status,10);
        return this.relay_status();
    }

    relay_status(request)
    {
        var resp = {
            "type": "response",
            "command": "relay_status",
            "payload": {
                "relay_status": this.main_light_status
            }
        }
        return resp;
    }

}

module.exports = Relay_module;