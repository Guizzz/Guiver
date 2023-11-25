const Link_manager = require("../../connections/link_manager");
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');

class API_Server
{   
    constructor()
    {
        this.link_manager = new Link_manager("API_SERVER", "api_queue");
        this.link_manager.start();
        // this.link_manager.on("msg", this.send_client.bind(this));
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());

        this.app.post('/manual_led', this.handle_led_req.bind(this));
        this.app.post('/rainbow_start', this.handle_rainbow_start.bind(this));
        this.app.post('/rainbow_stop', this.handle_rainbow_stop.bind(this));
        this.app.listen(process.env.API_PORT, () => console.log("API Server started"));
    }

    handle_led_req(req,res)
    {
        console.log("API request:" + req);
        var redValue = 0;
        var greenValue = 0;
        var blueValue = 0;
        var error = "";

        if(req.query.redValue)
        {
            try
            {
                var req_val = parseInt(req.query.redValue);
                if (req_val>=0 && req_val < 256)
                    redValue = req_val
                else
                    error = "Led value must be between 0 and 255";
            }
            catch
            {
                error = "Led value can only be numbers";
            }
        }
        if(req.query.greenValue)
        {
            try
            {
                var req_val = parseInt(req.query.greenValue);
                if (req_val>=0 && req_val < 256)
                    greenValue = req_val
                else
                    error = "Led value must be between 0 and 255";
            }
            catch
            {
                error = "Led value can only be numbers";
            }

        }
        if(req.query.blueValue)
        {
            try
            {
                var req_val = parseInt(req.query.blueValue);
                if (req_val>=0 && req_val < 256)
                    blueValue = req_val
                else
                    error = "Led value must be between 0 and 255";
            }
            catch
            {
                error = "Led value can only be numbers";
            }

        }

        var j_cmd = {
            "type": "request",
            "command": "led_manual",
            "payload": {
                "redValue": parseInt(redValue),
                "greenValue": parseInt(greenValue),
                "blueValue": parseInt(blueValue),
            }
        }

        if (error != "")
        {
            res.send(error);
            return;
        }
        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        res.send("OK!");

        // this.link_manager.on("msg", function(data){
        //     res.send(data);
        // }.bind(this))
    }

    handle_rainbow_start(req,res)
    {
        var j_cmd = {
            "type": "request",
            "command": "rainbow_start",
            "payload" :{
                "time": 30,
                "brightnes":254
            }
            
        }

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        res.send("OK!");
    }

    handle_rainbow_stop(req,res)
    {
        var j_cmd = {
            "type": "request",
            "command": "rainbow_stop",            
        }

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        res.send("OK!");
    }
}


module.exports = API_Server