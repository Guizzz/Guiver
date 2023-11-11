const Link_manager = require("../connections/link_manager");
const Module = require("./module");
//var Gpio = require('pigpio').Gpio;

class Led_module extends Module
{
    constructor()
    {
        super("LED_MODULE", "led_queue");
        this.set_handled_cmds({
            "led_manual": this.led_manual_mgmt.bind(this)
        });
        this._init_led();
        this._set_led()
    }

    _init_led()
    {
        this.redValue=0;
        this.greenValue=0;
        this.blueValue=0;
        this.RedLed = new Gpio(4, {mode: Gpio.OUTPUT});
        this.GreenLed = new Gpio(17, {mode: Gpio.OUTPUT});
        this.BlueLed = new Gpio(18, {mode: Gpio.OUTPUT});
    }

    _set_led()
    {
        this.RedLed.pwmWrite(parseInt(this.redValue,10));
        this.GreenLed.pwmWrite(parseInt(this.greenValue,10));
        this.BlueLed.pwmWrite(parseInt(this.blueValue,10));
    }

    led_manual_mgmt(command)
    {
        if(command.hasOwnProperty("redValue"))
            this.redValue=command.redValue;
        
        if(command.hasOwnProperty("greenValue"))
            this.greenValue=command.greenValue;
        
        if(command.hasOwnProperty("blueValue"))
            this.blueValue=command.blueValue;
        
        this._set_led();

        var resp = new Object();
        resp.command = "to_client";
        resp.payload = {
            "RedLed": this.redValue,
            "GreenLed": this.greenValue,
            "BlueLed": this.blueValue,
        };

        console.log(resp);

        this.link_manager.to_core("core_queue", JSON.stringify(resp));
    }
    
}

module.exports = Led_module;