const Module = require("./module");
const Http = require("../../connections/utils/http");

class Weather_module extends Module
{
    constructor()
    {
        super("WEATHER_MODULE", "weather_queue");
        this.set_handled_cmds({
            "get_weather": this.get_weather.bind(this)
        });
        this.http = new Http();
    }

    async get_weather(command)
    {
        var url = "https://api.openweathermap.org/data/2.5/weather?q=latina&units=metric&appid=" + process.env.WEATHER_KEY; // TODO

        this.http.get(url,function(res){
            let data = [];
            // const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
            // console.log('Status Code:', res.statusCode);
            // console.log('Date in Response header:', headerDate);
          
            res.on('data', chunk => {
              data.push(chunk);
            });
          
            res.on('end', function(){
              // console.log('Response ended: ');
              // console.log(Buffer.concat(data).toString());
              var resp = new Object();

              var resp = {
                "type" : "response",
                "command": "get_weather",
                "payload": JSON.parse(Buffer.concat(data).toString()),
              }
              
              this.link_manager.to_core("core_queue", JSON.stringify(resp));
            }.bind(this));
          }.bind(this))
    }
    
}

module.exports = Weather_module;