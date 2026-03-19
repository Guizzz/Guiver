const Module = require("../module");

let Gpio = null;

const RELAY_PIN = 2;

const pin_map = {
  light: {
    status: false,
    pin: RELAY_PIN,
    GPIO: null,
  },
};

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

class Relay_module extends Module {
  constructor(config) {
    super("RELAY_MODULE", "relay_queue", config);

    this.set_handled_cmds({
      set_relay: this.set_relay.bind(this),
      relay_status: this.relay_status.bind(this),
    });

    try {
        Gpio = require("pigpio").Gpio;
    } catch {
        this.log.error("pigpio not available - mock mode");
    }

    this._init_pin();
  }

  _init_pin() {
    for (const key in pin_map) {
      if (Gpio) {
        pin_map[key].GPIO = new Gpio(pin_map[key].pin, {
          mode: Gpio.OUTPUT,
        });

        pin_map[key].GPIO.digitalWrite(0);
      }
    }
  }

  async set_relay(command) {
    const commandName = "set_relay";

    try {
      const { relay, set_relay } = command.payload || {};

      if (set_relay === undefined) {
        throw new Error("set_relay missing");
      }

      if (!relay) {
        throw new Error("relay missing");
      }

      if (!pin_map[relay]) {
        throw new Error(`relay '${relay}' not found`);
      }

      pin_map[relay].status = !!set_relay;

      if (pin_map[relay].GPIO) {
        pin_map[relay].GPIO.digitalWrite(pin_map[relay].status ? 1 : 0);
      }

      return this.sendResponse(commandName, this._getStatusPayload());

    } catch (err) {
      return this.sendError(commandName, err);
    }
  }

  async relay_status() {
    const commandName = "relay_status";

    try {
      return this.sendResponse(commandName, this._getStatusPayload());
    } catch (err) {
      return this.sendError(commandName, err);
    }
  }

  _getStatusPayload() {
    const payload = {};

    for (const key in pin_map) {
      payload[key] = pin_map[key].status;
    }

    return payload;
  }

}

module.exports = Relay_module;