const Link_manager = require("../../utils/link_manager");
const { moduleLogger } = require('../../utils/logger');

class Module
{
    constructor(module_name, module_queue, config = {})
    {   
        this.module_name = module_name;
        this.module_queue = module_queue;

        this.moduleLogger = moduleLogger(this.module_name);

        this.CONFIG = config;
        if(this.CONFIG != {})
            this.moduleLogger.info("Config loaded:" + JSON.stringify(config));

        this.commands_handled = new Object();
        this.link_manager = new Link_manager(module_name, module_queue, (m) => this.moduleLogger.info(m));
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

    async manage_request(message)
    {
        this.moduleLogger.debug("["+this.module_name+"] Message recived: " + message);
        var j_msg = JSON.parse(message);
        var req_cmd = j_msg.command = j_msg.command.trim();
        if(this.commands_handled.hasOwnProperty(req_cmd))
        {
            var cmdManager = this.commands_handled[req_cmd];
            var data = await cmdManager(j_msg);
            if (data != undefined && data != JSON.stringify("{}"))
                this.link_manager.to_core("core_queue", JSON.stringify(data));
            return;
        }

        this.moduleLogger.error("Command ["+req_cmd+"] not implemented error");
        j_msg.payload = "ERROR: Command ["+req_cmd+"] not implemented";
        j_msg.error = 500;
        this.link_manager.to_core("core_queue", JSON.stringify(j_msg));
    }

    
}

module.exports = Module;