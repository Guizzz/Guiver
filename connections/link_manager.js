const EventEmitter = require('events');
class Link_manager extends EventEmitter
{
    constructor()
    {
        super();
        console.log("Link Manager inizializated...")
    }

    start()
    {
        console.log("Link Manager started...");
        var stdin = process.openStdin();
        stdin.on('data', this.from_core.bind(this));
    }

    to_core(data)
    {
        console.log("Recived:", data);
        var j_data = JSON.parse(data);
        this.from_core(data);
    }

    from_core(data)
    {   
        console.log("core wants to sent", data.toString().trim());
        this.emit("msg", data.toString().trim())
    }
}

module.exports = Link_manager