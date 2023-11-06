const Link_manager = require("../connections/link_manager");
const Http = require("../connections/http");
require('dotenv').config({ path: '../.env' })

class Wether_module
{
    constructor()
    {
        this.link_manager = new Link_manager("WETHER_MODULE", "wether_queue");
        this.link_manager.start();
        this.http = new Http();
        this.link_manager.on("msg", this.manage_request.bind(this));

        this.commands_handled = new Object();
        this.commands_handled["get_wether"] = this.get_wether;
        
    }
    start()
    {
        var cmds = Object.keys(this.commands_handled);
        var j_msg = {
            "command": "module_config",
            "module": "Wether_module",
            "module_queue": "wether_queue",
            "commands_handled": cmds
        }

        //this.link_manager.to_core("core_queue", JSON.stringify(j_msg));

    }

    manage_request(message)
    {
        console.log("[Wether_module] Message recived: ", message);
        var j_msg = JSON.parse(message);
        var req_cmd = j_msg.command;
        if(this.command.hasOwnProperty(req_cmd))
        {
            var cmdManager = this.commands_handled[req_cmd];
            var response = cmdManager(j_msg);
            this.link_manager.to_core(JSON.stringify(response));
            return;
        }

        console.log("[Wether_module] Command ["+req_cmd+"] not implemented error");
        j_msg.payload = "ERROR: Command ["+req_cmd+"] not implemented";
        j_msg.error = 500;
        this.link_manager.to_core(JSON.stringify(j_msg));

    }

    get_wether()
    {
        var url = "https://api.openweathermap.org/data/2.5/weather?q=latina&appid=" + process.env.WETHER_KEY; // TODO
        this.http.get(url,res => {
            let data = [];
            const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
            console.log('Status Code:', res.statusCode);
            console.log('Date in Response header:', headerDate);
          
            res.on('data', chunk => {
              data.push(chunk);
            });
          
            res.on('end', () => {
              console.log('Response ended: ');
              //const res = JSON.parse(Buffer.concat(data).toString());
              console.log(Buffer.concat(data).toString());
            });
          } )
    }
    
}

module.exports = Wether_module;