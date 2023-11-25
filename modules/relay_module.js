const Module = require("./module");
var Gpio = require('pigpio').Gpio;

class Relay_module extends Module
{
    constructor()
    {
        super("LED_MODULE", "led_queue");
        this.set_handled_cmds({
            "light_on": this.light_on.bind(this),           
        });
        this._init_led();
    }
    _init_pin()
    {
        this.main_light_status=0;
        this.main_light = new Gpio(5, {mode: Gpio.OUTPUT});
        this.main_light.digitalWrite(this.main_light_status,10);
    }

    light_on() {
        this.main_light_status=1;
        this.main_light.digitalWrite(this.main_light_status,10);
    }

}