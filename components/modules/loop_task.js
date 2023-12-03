const Module = require("./module");

class LoopTask_module extends Module
{
    constructor()
    {
        super("LOOP_MODULE", "loop_queue");
        this.set_handled_cmds({
            "add_loop_task": this._add_loop_task.bind(this),
            "delete_loop_task": this._delete_loop_task.bind(this),
        });
        this.tasks = {}
    }

    _add_loop_task(command)
    {   
        var delta_time = 5000;

        if(command.hasOwnProperty("delta_time"))
            delta_time = command.delta_time;

       
        if(command.hasOwnProperty("command_to_loop"))
        {
            command["type"] = "request";
            command["command"] = command.command_to_loop;
            command["payload"] = command.payload;
            this.tasks[command.command_to_loop] = setInterval(function(){
                this.link_manager.to_core("core_queue", JSON.stringify(command));
            }.bind(this), delta_time);
            
            delete command["delta_time"];
            delete command["command_to_loop"];
        }
        

        return undefined;
    }

    _delete_loop_task(command)
    {
        if(command.hasOwnProperty("command_to_unloop"))
        {
            console.log("stop loop :",command.command_to_unloop )
            clearInterval(this.tasks[command.command_to_unloop]);
        }
        return undefined
    }

}

module.exports = LoopTask_module;