const Module = require("../module");
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

var pin_map = {
    light: {
        "status": false,
        "pin": REALAY_PIN
    }
}

/*
request: 
{
    "type": "request",
    "command": "set_relay",
    "payload" :{
        "set_relay": true, <---------- value to set
        "relay": "light",  <---------- name of the relay on pin_map
    }
}

*/


class Relay_module extends Module
{
    constructor(config)
    {
        super("RELAY_MODULE", "relay_queue", config);
        this.set_handled_cmds({
            "set_relay": this.set_relay.bind(this),
            "relay_status": this.relay_status.bind(this)
        });
        this._init_pin();
    }

    _init_pin()
    {
        for (var p in pin_map)
        {
            console.log(pin_map[p]);
            pin_map[p]["GPIO"] = new Gpio(pin_map[p].pin, {mode: Gpio.OUTPUT});
            pin_map[p]["GPIO"].digitalWrite(false,10);
        }
    }

    set_relay(request) {

        if(request.payload.set_relay === undefined)
            return this.relay_error("set_relay not found in payload");

        if(request.payload.relay === undefined || request.payload.relay === "")
            return this.relay_error("relay not found in payload or is empty");
        
        var pin_ID = request.payload.relay;

        pin_map[pin_ID]["status"] = request.payload.set_relay;
        pin_map[pin_ID]["GPIO"].digitalWrite(pin_map[pin_ID]["status"], 10);
        return this.relay_status();
    }

    relay_error(msg)
    {
        var resp = {
            "type": "response",
            "command": "relay_status",
            "payload": {
                "ERROR": msg
            }
        }
    }

    relay_status()
    {
        var resp = {
            "type": "response",
            "command": "relay_status",
            "payload": {}
        }

        for (var p in pin_map)
        {
            resp["payload"][p] = pin_map[p]["status"]
        }
        
        return resp;
    }

}

module.exports = Relay_module;