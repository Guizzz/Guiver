var Link_manager = require("../../connections/utils/link_manager");


class Core
{
    constructor()
    {
        this.link_manager = new Link_manager("CORE", "core_queue");
        this.link_manager.start();
        this.link_manager.on("msg", this.manage_request.bind(this));
        this.command_handled = new Object();
    }

    commands_management(new_config)
    {
        for ( var cmd of new_config.commands_handled)
        {
            this.command_handled[cmd] = new_config.module_queue;
        }
        console.log("New command_handled:",this.command_handled)
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
                return;
            }  
        }
        else if (j_msg.type == "response")
        {
            this.link_manager.to_core("clients_queue",JSON.stringify(j_msg));
            this.link_manager.to_core("api_queue",JSON.stringify(j_msg));
            return;
        }

        console.log("[core] Command <"+req_cmd+"> not implemented error");
        j_msg.payload = "ERROR: Command <"+req_cmd+"> not implemented";
        j_msg.error = 500;
        this.link_manager.to_core("clients_queue",JSON.stringify(j_msg));
        this.link_manager.to_core("api_queue",JSON.stringify(j_msg));

    }
}

module.exports = Core