const Link_manager = require("../connections/link_manager");
const Http = require("../connections/http");

class Weather_module
{
    constructor()
    {
        this.commands_handled = new Object();
        this.commands_handled["get_weather"] = this.get_weather.bind(this);
        this.http = new Http();
        this.link_manager = new Link_manager("WEATHER_MODULE", "weather_queue");
        this.link_manager.on("msg", this.manage_request.bind(this));
        this.link_manager.on("channel_new", this.start.bind(this));
        this.link_manager.start();
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
        this.link_manager.to_core("core_queue", JSON.stringify(j_msg));
    }

    manage_request(message)
    {
        console.log("[Wether_module] Message recived: ", message);
        var j_msg = JSON.parse(message);
        var req_cmd = j_msg.command = j_msg.command.trim();
        if(this.commands_handled.hasOwnProperty(req_cmd))
        {
            var cmdManager = this.commands_handled[req_cmd];
            cmdManager(j_msg);
            return;
        }

        console.log("[Wether_module] Command ["+req_cmd+"] not implemented error");
        j_msg.payload = "ERROR: Command ["+req_cmd+"] not implemented";
        j_msg.error = 500;
        this.link_manager.to_core("core_queue", JSON.stringify(j_msg));

    }

    get_weather(command)
    {
        var url = "https://api.openweathermap.org/data/2.5/weather?q=latina&appid=" + process.env.WEATHER_KEY; // TODO
        this.http.get(url,function(res){
            let data = [];
            const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
            console.log('Status Code:', res.statusCode);
            console.log('Date in Response header:', headerDate);
          
            res.on('data', chunk => {
              data.push(chunk);
            });
          
            res.on('end', function(){
              console.log('Response ended: ');
              console.log(Buffer.concat(data).toString());
              var resp = new Object();
              resp.command = "to_client";
              resp.payload = Buffer.concat(data).toString();
              this.link_manager.to_core("core_queue", JSON.stringify(resp));
            }.bind(this));
          }.bind(this))
    }
    
}

module.exports = Weather_module;