const Wss_manager = require("../utils/wss_manager");
const Link_manager = require("../utils/link_manager");

class Client_Manager
{   
    constructor()
    {
        this.link_manager = new Link_manager("CLNT_MGMT", "clients_queue");
        this.wss_manager = new Wss_manager(process.env.WSS_CLI_PORT, "ws_msg");
        this.link_manager.start();
        this.wss_manager.start();

        this.wss_manager.on("ws_msg", this.from_client.bind(this));
        this.link_manager.on("msg", this.send_client.bind(this));
    }

    from_client(msg) 
    {
        return this.link_manager.to_core("core_queue", msg);
    }

    send_client(msg)
    {   
        console.log("client_manager", msg)
        return this.wss_manager.send_response(msg);
    }

}


module.exports = Client_Manager