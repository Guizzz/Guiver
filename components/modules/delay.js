const Module = require("./module");

function sleep(time) {
    console.log("waiting for :", time)
    return new Promise(resolve => setTimeout(resolve, time));
  }

class Delay_module extends Module
{
    constructor()
    {
        super("DELAY_MODULE", "delay_queue");
        this.set_handled_cmds({
            "delay": this._delay.bind(this),           
        });
    }

    async _delay(command)
    {   
        var cmd = {
            "type": "reqeust"
        }
        var delay_time = 0;
        if(command.hasOwnProperty("delay_time"))
            delay_time = command.delay_time;

        if(command.hasOwnProperty("command_to_delay"))
        {
            cmd["command"] = command.command_to_delay;
            cmd["payload"] = command.payload;
        }
        
        await sleep(parseInt(delay_time,10));
        console.log("wait Done")
        return cmd;
    }

}

module.exports = Delay_module;