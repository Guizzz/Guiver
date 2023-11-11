const Link_manager = require("../connections/link_manager");
//var Gpio = require('pigpio').Gpio;

class Led_module
{
    constructor()
    {
        this.commands_handled = new Object();
        this.commands_handled["led_manual"] = this.led_manual_mgmt.bind(this);
        this.link_manager = new Link_manager("LED_MODULE", "led_queue");
        this.link_manager.on("msg", this.manage_request.bind(this));
        this.link_manager.on("channel_new", this._start.bind(this));
        this.link_manager.start();
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
    
    _start()
    {
        var cmds = Object.keys(this.commands_handled);
        var j_msg = {
            "command": "module_config",
            "module": "Led_module",
            "module_queue": "led_queue",
            "commands_handled": cmds
        }
        this.link_manager.to_core("core_queue", JSON.stringify(j_msg));
    }

    manage_request(message)
    {
        console.log("[Led_module] Message recived: ", message);
        var j_msg = JSON.parse(message);
        var req_cmd = j_msg.command = j_msg.command.trim();
        if(this.commands_handled.hasOwnProperty(req_cmd))
        {
            var cmdManager = this.commands_handled[req_cmd];
            cmdManager(j_msg);
            return;
        }

        console.log("[Led_module] Command ["+req_cmd+"] not implemented error");
        j_msg.payload = "ERROR: Command ["+req_cmd+"] not implemented";
        j_msg.error = 500;
        this.link_manager.to_core("core_queue", JSON.stringify(j_msg));
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