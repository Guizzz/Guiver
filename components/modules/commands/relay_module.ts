import Module from "../module";

let Gpio: any = null;
try {
  Gpio = require("pigpio").Gpio;
} catch {
  console.log("pigpio not available - relay module mock mode");
}

class Relay_module extends Module {
  private pin_map: Record<string, { status: boolean; pin: number; GPIO: any }>;

  constructor(config: any) {
    super("RELAY_MODULE", "relay_queue", config);

    this.setHandledCmds({
      set_relay: this.set_relay.bind(this),
      relay_status: this.relay_status.bind(this),
    });

    try {
      Gpio = require("pigpio").Gpio;
    } catch {
      this.log.error("pigpio not available - relay module mock mode");
    }

    this.pin_map = {
      light: {
        status: false,
        pin: this.CONFIG?.light_pin ?? 2,
        GPIO: null,
      },
    };

    this._init_pin();
  }

  _init_pin() {
    for (const key in this.pin_map) {
      if (Gpio) {
        this.pin_map[key].GPIO = new Gpio(this.pin_map[key].pin, {
          mode: Gpio.OUTPUT,
        });

        this.pin_map[key].GPIO.digitalWrite(0);
      }
    }
  }

  async set_relay(request: any) {
    const commandName = "set_relay";
    const id = request.id;

    try {
      const { relay, set_relay } = request.payload || {};

      if (set_relay === undefined) {
        throw new Error("set_relay missing");
      }

      if (!relay) {
        throw new Error("relay missing");
      }

      if (!this.pin_map[relay]) {
        throw new Error(`relay '${relay}' not found`);
      }

      this.pin_map[relay].status = !!set_relay;

      if (this.pin_map[relay].GPIO) {
        this.pin_map[relay].GPIO.digitalWrite(this.pin_map[relay].status ? 1 : 0);
      }

      return this.sendResponse(commandName, id, this._getStatusPayload());

    } catch (err: any) {
      return this.sendError(commandName, err);
    }
  }

  async relay_status(request: any) {
    const commandName = "relay_status";

    try {
      return this.sendResponse(commandName, request.id, this._getStatusPayload());
    } catch (err: any) {
      return this.sendError(commandName, err);
    }
  }

  _getStatusPayload() {
    const payload: Record<string, boolean> = {};

    for (const key in this.pin_map) {
      payload[key] = this.pin_map[key].status;
    }

    return payload;
  }
}

export default Relay_module;
