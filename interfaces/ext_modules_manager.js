const Wss_manager = require("../utils/wss_manager");
const Link_manager = require("../utils/link_manager");
const { interfaceLogger } = require('../utils/logger');

class Ext_Module_Manager
{   
    constructor()
    {   
        this.logger = interfaceLogger("WSS_MODULES");
        this.link_manager = new Link_manager("MODULES_MGMT", "modules_queue", (msg) => this.logger.debug(msg));
        this.wss_manager = new Wss_manager(process.env.WSS_MDL_PORT, "mdl_ws_msg", (msg) => this.logger.debug(msg));
        this.link_manager.start();
        this.wss_manager.start();

        this.wss_manager.on("mdl_ws_msg", this.from_client.bind(this));
        this.link_manager.on("msg", this.send_client.bind(this));
        this.link_manager.on("channel_new", this._start.bind(this));
    }

    _start()
    {
        var j_msg = {
            type: "managment",
            command: "response_config",
            module: "MODULES_MGMT",
            module_queue: "modules_queue",
        };
        this.link_manager.toCore("core_queue", JSON.stringify(j_msg));
    }

    from_client(msg) 
    {
        return this.link_manager.toCore("core_queue", msg);
    }

    send_client(msg)
    {   
        return this.wss_manager.send_response(msg);
    }

}


module.exports = Ext_Module_Manager