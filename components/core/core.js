var Link_manager = require("../../connections/link_manager");

class Core
{
    constructor()
    {
        this.link_manager = new Link_manager("CORE")
        this.link_manager.start()
        this.link_manager.on("msg", this.manage_request.bind(this));
    }

    start()
    {
        var stdin = process.openStdin();
        stdin.on('data', this.link_manager.to_core.bind(this));  //TODO: fix
    }

    manage_request(message)
    {
        console.log("[core] Message recived: ", message);
        var j_msg = JSON.parse(message);
        this.link_manager.to_core(j_msg.payload);
    }
}

module.exports = Core