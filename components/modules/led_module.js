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


class Led_module extends Module
{
    constructor()
    {   
        super("LED_MODULE", "led_queue");
        if(Gpio == null)
        {
            console.log("Led Module do not loaded")
            return;
        }

        this.set_handled_cmds({
            "led_manual": this.led_manual_mgmt.bind(this),
            "rainbow_start": this.rainbow_start.bind(this),
            "rainbow_stop": this.rainbow_stop.bind(this),
            "led_status": this.led_status.bind(this),            
        });
        this._init_led();
        this._set_led();
        this.rainbowRunning = false;
        this.rainbowBrightness=255;
        this.time=50;
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
    
    led_status(request)
    {
        var resp = {
            "type": "response",
            "command": "led_status",
            "payload": {
                "rainbow_status":{
                    "rainbowRunning": this.rainbowRunning,
                    "time": this.time,
                    "brightnes": this.rainbowBrightness
                },
                "redValue": this.redValue,
                "greenValue": this.greenValue,
                "blueValue": this.blueValue,
            }
        }
        return resp;
    }
    
    led_manual_mgmt(request)
    {
        
        if(request.payload.hasOwnProperty("redValue"))
            this.redValue=request.payload.redValue;
        
        if(request.payload.hasOwnProperty("greenValue"))
            this.greenValue=request.payload.greenValue;
        
        if(request.payload.hasOwnProperty("blueValue"))
            this.blueValue=request.payload.blueValue;
        
        this._set_led();

        return this.led_status("");
    }

    rainbow_stop(request)
    {
        this.rainbowRunning = false;

        var resp = {
            "type" : "response",
            "command": "rainbow_stop"
        }

        return this.led_status("");
    }

    rainbow_start(request)
    {
        var time=request.payload.time;
        var brightnes=request.payload.brightnes;
        this.rainbowBrightness = parseInt(brightnes,10);
        
        if(this.rainbowRunning) 
        {
            request.error = "Rainbow already running";
            this.link_manager.to_core("core_queue", JSON.stringify(request));
            return;
        }
            
        if(time==undefined)
        {
            request.error = "Time delay is undefined";
            this.link_manager.to_core("core_queue", JSON.stringify(request));
            return;
        }

        this.time = parseInt(time,10);

        if(time<20) //to do
        {
            request.error = "Time frequence is too high";
            this.link_manager.to_core("core_queue", JSON.stringify(request));
            return;
        }

        this.rainbowRunning=true;

        this._startRainbow();

        return this.led_status("");
    }

    async _startRainbow()
    {
        console.log("Starting Rainbow, rainbowBrightness:", this.rainbowBrightness);
        for(; this.redValue<this.rainbowBrightness; this.redValue++)
        {
            this.RedLed.pwmWrite(parseInt(this.redValue,10));
            await this._sleep(this.time);
        }

        while(this.rainbowRunning)
        {
            for(; this.greenValue<this.rainbowBrightness && this.rainbowRunning; this.greenValue++)
            {
                this.GreenLed.pwmWrite(parseInt(this.greenValue,10));
                await this._sleep(this.time);
            }
            
            for(; this.redValue>0 && this.rainbowRunning; this.redValue--)
            {
                this.RedLed.pwmWrite(parseInt(this.redValue,10));
                await this._sleep(this.time);
            }

            for(; this.blueValue<this.rainbowBrightness && this.rainbowRunning; this.blueValue++)
            {
                this.BlueLed.pwmWrite(parseInt(this.blueValue,10));
                await this._sleep(this.time);
            }

            for(; this.greenValue>0 && this.rainbowRunning; this.greenValue--)
            {
                this.GreenLed.pwmWrite(parseInt(this.greenValue,10));
                await this._sleep(this.time);
            }

            for(; this.redValue<this.rainbowBrightness && this.rainbowRunning; this.redValue++)
            {
                this.RedLed.pwmWrite(parseInt(this.redValue,10));
                await this._sleep(this.time);
            }

            for(; this.blueValue>0 && this.rainbowRunning; this.blueValue--)
            {
                this.BlueLed.pwmWrite(parseInt(this.blueValue,10));
                await this._sleep(this.time);
            }
        }

        for(var i=255; i>0 ; i--)
        {
            if(this.redValue>0)   this.RedLed.pwmWrite(parseInt(this.redValue--,10));
            if(this.greenValue>0) this.GreenLed.pwmWrite(parseInt(this.greenValue--,10));
            if(this.blueValue>0)  this.BlueLed.pwmWrite(parseInt(this.blueValue--,10));
            await this._sleep(parseInt(this.time/2, 10));
        }
    }

    _sleep(millis) 
    {
        return new Promise(resolve => setTimeout(resolve, millis));
    }
    
}

module.exports = Led_module;