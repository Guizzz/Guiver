const Link_manager = require("../connections/link_manager");

class Module
{
    constructor(module_name, module_queue)
    {   
        this.module_name = module_name;
        this.module_queue = module_queue;

        this.commands_handled = new Object();
        this.link_manager = new Link_manager(module_name, module_queue);
        this.link_manager.on("msg", this.manage_request.bind(this));
        this.link_manager.start();
    }

    set_handled_cmds(commands_handled)
    {
        this.commands_handled = commands_handled;
        this.link_manager.on("channel_new", this._start.bind(this));
    }

    
    _start()
    {
        var cmds = Object.keys(this.commands_handled);
        var j_msg = {
            "type": "managment",
            "command": "module_config",
            "module": this.module_name,
            "module_queue": this.module_queue,
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
            var data = cmdManager(j_msg);
            this.link_manager.to_core("core_queue", JSON.stringify(data));
            return;
        }

        console.log("[Led_module] Command ["+req_cmd+"] not implemented error");
        j_msg.payload = "ERROR: Command ["+req_cmd+"] not implemented";
        j_msg.error = 500;
        this.link_manager.to_core("core_queue", JSON.stringify(j_msg));
    }

    
}

module.exports = Module;