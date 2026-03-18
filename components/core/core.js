var Link_manager = require("../../utils/link_manager");
const { coreLogger } = require('../../utils/logger');

class Core
{
    constructor()
    {
        this.link_manager = new Link_manager("CORE", "core_queue", (msg) => coreLogger.debug(msg));
        this.link_manager.start();
        this.link_manager.on("msg", this.manage_request.bind(this));
        this.command_handled = new Object();
        this.response_handlers = [];

        this.managment_handlers = {
            "module_config": this.commands_management.bind(this),
            "response_config": this.response_management.bind(this)
        }
    }

    commands_management(new_config)
    {
        for ( var cmd of new_config.commands_handled)
        {
            this.command_handled[cmd] = new_config.module_queue;
        }
        coreLogger.info("New command_handled: " + JSON.stringify(this.command_handled))
    }

    response_management(new_conf)
    {
        this.response_handlers.push(new_conf.module_queue);
        coreLogger.info("New response_handlers: " + this.response_handlers)
    }

    send_response(j_msg)
    {
        for (var resp_manager of this.response_handlers)
        {
            coreLogger.info("Sending response to " + resp_manager)
            this.link_manager.to_module(resp_manager,JSON.stringify(j_msg));
        }
    }

    manage_request(message)
    {
        coreLogger.debug("Message recived: " + message);
        var j_msg = JSON.parse(message);

        if(j_msg.hasOwnProperty("error"))
        {
            coreLogger.error("Command <"+req_cmd+"> has failed: " + j_msg.error);
            j_msg.payload = "ERROR: " + j_msg.error;
            j_msg.error = 500;
            this.send_response(j_msg);
            return;
        }

        if(!j_msg.hasOwnProperty("command"))
        {
            coreLogger.info("wrong message")
            return;
        }

        var req_cmd = j_msg.command = j_msg.command.trim();

        if(j_msg.type == "request")
        {
            if(this.command_handled.hasOwnProperty(req_cmd))
            {
                var queue = this.command_handled[req_cmd];
                this.link_manager.to_module(queue, message);
                return;
            }
            if(req_cmd == "list_commands")
            {
                this.send_response({"payload": Object.keys(this.command_handled)});
                return;
            }
        }
        else if (j_msg.type == "managment")
        {
            if(this.managment_handlers.hasOwnProperty(req_cmd))
            {
                this.managment_handlers[req_cmd](j_msg);
                return;
            }
        }
        else if (j_msg.type == "response")
        {
            this.send_response(j_msg)
            return;
        }

        coreLogger.error("Command <"+req_cmd+"> not implemented error");
        j_msg.payload = "ERROR: Command <"+req_cmd+"> not implemented";
        j_msg.error = 500;
        this.send_response(j_msg)
    }
}

module.exports = Core