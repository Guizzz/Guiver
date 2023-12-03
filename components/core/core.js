var Link_manager = require("../../connections/utils/link_manager");


class Core
{
    constructor()
    {
        this.link_manager = new Link_manager("CORE", "core_queue");
        this.link_manager.start();
        this.link_manager.on("msg", this.manage_request.bind(this));
        this.command_handled = new Object();
        this.response_handlers = [];
    }

    commands_management(new_config)
    {
        for ( var cmd of new_config.commands_handled)
        {
            this.command_handled[cmd] = new_config.module_queue;
        }
        console.log("New command_handled:",this.command_handled)
    }

    response_management(new_conf)
    {
        this.response_handlers.push(new_conf.module_queue);
        console.log("New response_handlers:",this.response_handlers)
    }

    send_response(j_msg)
    {
        for (var resp_manager of this.response_handlers)
        {
            console.log("Sending response to ", resp_manager)
            this.link_manager.to_core(resp_manager,JSON.stringify(j_msg));
        }
    }

    manage_request(message)
    {
        console.log("[core] Message recived: ", message);
        var j_msg = JSON.parse(message);

        if(!j_msg.hasOwnProperty("command"))
        {
            console.log("wrong message")
            return;
        }

        var req_cmd = j_msg.command = j_msg.command.trim();

        if(j_msg.type == "request")
        {
            if(this.command_handled.hasOwnProperty(req_cmd))
            {
                var queue = this.command_handled[req_cmd];
                this.link_manager.to_core(queue, message);
                return;
            }
        }
        else if (j_msg.type == "managment")
        {
            if (req_cmd == "module_config")
            {
                this.commands_management(j_msg);
            }
            else if (req_cmd == "response_config")
            {
                this.response_management(j_msg);
            }  
            return;
        }
        else if (j_msg.type == "response")
        {
            this.send_response(j_msg)
            return;
        }

        console.log("[core] Command <"+req_cmd+"> not implemented error");
        j_msg.payload = "ERROR: Command <"+req_cmd+"> not implemented";
        j_msg.error = 500;
        this.send_response(j_msg)
    }
}

module.exports = Core