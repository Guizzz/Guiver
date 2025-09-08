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

var pin_map = {
    light: {
        "status": false,
        "pin": REALAY_PIN
    }
}

class Relay_module extends Module
{
    constructor()
    {
        super("RELAY_MODULE", "relay_queue");
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

        console.log("[SET_RELAY] " + request.payload.set_relay)

        if(request.payload.set_relay === undefined)
            return this.relay_status();

        if(request.payload.relay === undefined || request.payload.relay === "")
            return this.relay_status();
        
        pin_map[request.payload.relay]["status"] = request.payload.set_relay;
        pin_map[request.payload.relay]["GPIO"].digitalWrite(pin_map[request.payload.relay]["status"],10);
        return this.relay_status();
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