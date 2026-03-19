const Module = require("../module");

let Gpio = null;
try {
  Gpio = require("pigpio").Gpio;
} catch {
  console.log("pigpio not available - LED module will not control hardware");
}

class Led_module extends Module {
  constructor(config) {
    super("LED_MODULE", "led_queue", config);

    try {
        Gpio = require("pigpio").Gpio;
    } catch {
        this.log.error("pigpio not available - LED module will not control hardware (pigpio missing)");
    }

    this.set_handled_cmds({
      led_manual: this.led_manual_mgmt.bind(this),
      rainbow_start: this.rainbow_start.bind(this),
      rainbow_stop: this.rainbow_stop.bind(this),
      led_status: this.led_status.bind(this),
    });

    this.redValue = 0;
    this.greenValue = 0;
    this.blueValue = 0;

    this.rainbowRunning = false;
    this.rainbowBrightness = 255;
    this.time = 50; // default sleep

    this._init_led();
  }

  _init_led() 
  {
    if(!Gpio)
        return;
    
    this.RedLed   = new Gpio(this.CONFIG.red_pin, { mode: Gpio.OUTPUT });
    this.GreenLed = new Gpio(this.CONFIG.green_pin, { mode: Gpio.OUTPUT });
    this.BlueLed  = new Gpio(this.CONFIG.blue_pin, { mode: Gpio.OUTPUT });

    this._apply_led_values();
  }

  _apply_led_values() 
  {
    if(!Gpio)
        return;
        
    this.RedLed.pwmWrite(this.redValue);
    this.GreenLed.pwmWrite(this.greenValue);
    this.BlueLed.pwmWrite(this.blueValue);
  }

  // ================= Responses =================

  led_status() 
  {
    const status = {
      rainbow_status: {
        rainbowRunning: this.rainbowRunning,
        time: this.time,
        brightnes: this.rainbowBrightness,
      },
      redValue: this.redValue,
      greenValue: this.greenValue,
      blueValue: this.blueValue,
    };

    return this.sendResponse("led_status", status);
  }

  led_manual_mgmt(request) 
  {
    const { redValue, greenValue, blueValue } = request.payload || {};

    if (redValue !== undefined) this.redValue = redValue;
    if (greenValue !== undefined) this.greenValue = greenValue;
    if (blueValue !== undefined) this.blueValue = blueValue;

    this._apply_led_values();

    return this.led_status();
  }

  rainbow_start(request) 
  {
    const time = parseInt(request.payload?.time);
    const brightnes = parseInt(request.payload?.brightnes);

    if (this.rainbowRunning) {
      return this.sendError("rainbow_start", "Rainbow already running");
    }

    if (!time || !brightnes) {
      return this.sendError("rainbow_start", "Missing time or brightness");
    }

    if (time < 20) {
      return this.sendError("rainbow_start", "Time frequency too high");
    }

    this.rainbowBrightness = brightnes;
    this.time = time;
    this.rainbowRunning = true;

    this._startRainbowAsync();

    return this.led_status();
  }

  rainbow_stop() 
  {
    this.rainbowRunning = false;
    return this.led_status();
  }

  // ================= Rainbow loop =================

  async _startRainbowAsync() 
  {
    this.log?.info("Starting rainbow loop");

    const step = 1;

    while (this.rainbowRunning) 
    {


         for(; this.greenValue<this.rainbowBrightness && this.rainbowRunning; this.greenValue++)
            {
                this._apply_led_values();
                await this._sleep(this.time);
            }
            
            for(; this.redValue>0 && this.rainbowRunning; this.redValue--)
            {
                this._apply_led_values();
                await this._sleep(this.time);
            }

            for(; this.blueValue<this.rainbowBrightness && this.rainbowRunning; this.blueValue++)
            {
                this._apply_led_values();
                await this._sleep(this.time);
            }

            for(; this.greenValue>0 && this.rainbowRunning; this.greenValue--)
            {
                this._apply_led_values();
                await this._sleep(this.time);
            }

            for(; this.redValue<this.rainbowBrightness && this.rainbowRunning; this.redValue++)
            {
                this._apply_led_values();
                await this._sleep(this.time);
            }

            for(; this.blueValue>0 && this.rainbowRunning; this.blueValue--)
            {
                this._apply_led_values();
                await this._sleep(this.time);
            }
    }

    // fade out all
    while (this.redValue || this.greenValue || this.blueValue) 
    {
      if (this.redValue > 0) this.redValue--;
      if (this.greenValue > 0) this.greenValue--;
      if (this.blueValue > 0) this.blueValue--;
      this._apply_led_values();
      await this._sleep(parseInt(this.time/2, 10));
    }

    this.log?.info("Rainbow stopped");
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = Led_module;