const Wss_manager = require("../../connections/wss_manager");
const Link_manager = require("../../connections/link_manager");
class Client_Manager
{   
    constructor()
    {
        this.link_manager = new Link_manager();
        this.wss_manager = new Wss_manager();
        this.link_manager.start();
        this.wss_manager.start();

        this.wss_manager.on("msg", this.from_client.bind(this));
        this.link_manager.on("msg", this.send_client.bind(this));
    }

    from_client(msg) 
    {
        return this.link_manager.to_core(msg);
    }

    send_client(msg)
    {   
        return this.wss_manager.send_response(msg);
    }

}


module.exports = Client_Manager