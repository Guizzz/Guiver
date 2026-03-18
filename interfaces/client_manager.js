const Wss_manager = require("../utils/wss_manager");
const Link_manager = require("../utils/link_manager");
const { interfaceLogger } = require('../utils/logger');

class Client_Manager
{   
    constructor()
    {
        this.logger = interfaceLogger("WSS_CLIENTS");
        this.link_manager = new Link_manager("CLNT_MGMT", "clients_queue", (msg) => this.logger.debug(msg));
        this.wss_manager = new Wss_manager(process.env.WSS_CLI_PORT, "ws_msg", (msg) => this.logger.debug(msg));
        this.link_manager.start();
        this.wss_manager.start();

        this.wss_manager.on("ws_msg", this.from_client.bind(this));
        this.link_manager.on("msg", this.send_client.bind(this));
        this.link_manager.on("channel_new", this._start.bind(this));
    }

    _start()
    {
        var j_msg = {
            "type": "managment",
            "command": "response_config",
            "module": "CLNT_MGMT",
            "module_queue": "clients_queue",
        }
        this.link_manager.to_core("core_queue", JSON.stringify(j_msg));
    }

    from_client(msg) 
    {
        return this.link_manager.to_core("core_queue", msg);
    }

    send_client(msg)
    {   
        this.logger.info(msg)
        return this.wss_manager.send_response(msg);
    }

}


module.exports = Client_Manager