const Module = require("./module");
const Http = require("../../connections/utils/https");

class Water_pump_module extends Module
{
    constructor()
    {
        super("WATER_PUMP_MODULE", "water_pump_queue");
        this.set_handled_cmds({
            "get_water_pump_status": this.get_water_pump_status.bind(this),
            "get_water_pump_ambient_temp": this.get_water_pump_ambient_temp.bind(this),
        });
        this.http = new Http();
    }

    get_water_pump_status(command)
    {
        var url = "http://192.168.1.31/get_status";

        this.http.get(url,function(res){
            let data = [];
          
            res.on('data', chunk => {
              data.push(chunk);
            });
          
            res.on('end', function(){
              // console.log('Response ended: ');
              // console.log(Buffer.concat(data).toString());
              var resp = new Object();

              var resp = {
                "type" : "response",
                "command": "get_water_pump_status",
                "payload": JSON.parse(Buffer.concat(data).toString()),
              }
              
              this.link_manager.to_core("core_queue", JSON.stringify(resp));
            }.bind(this));
          }.bind(this))
    }

    get_water_pump_ambient_temp(command)
    {
        var url = "http://192.168.1.31/get_temp";

        this.http.get(url,function(res){
            let data = [];
          
            res.on('data', chunk => {
              data.push(chunk);
            });
          
            res.on('end', function(){
              // console.log('Response ended: ');
              // console.log(Buffer.concat(data).toString());
              var resp = new Object();

              var resp = {
                "type" : "response",
                "command": "get_water_pump_status",
                "payload": JSON.parse(Buffer.concat(data).toString()),
              }
              
              this.link_manager.to_core("core_queue", JSON.stringify(resp));
            }.bind(this));
          }.bind(this))
    }
    
}

module.exports = Water_pump_module;