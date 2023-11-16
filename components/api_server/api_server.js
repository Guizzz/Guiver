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
        this.app.listen(process.env.API_PORT, () => console.log("API Server started"));
    }

    handle_led_req(req,res)
    {
        console.log("API request:" + req.query);
        var redValue = 0;
        var greenValue = 0;
        var blueValue = 0;
        var error = "";

        if(req.query.redValue)
        {
            try
            {
                redValue = parseInt(req.query.redValue);
            }
            catch
            {
                error = "Led value can only be numbers";
            }

            if (redValue<0 || redValue > 255)
                error = "Led value must be between 0 and 255";
        }
        if(req.query.greenValue)
        {
            try
            {
                greenValue = parseInt(req.query.greenValue);
            }
            catch
            {
                error = "Led value can only be numbers";
            }

            if (greenValue<0 || greenValue > 255)
                error = "Led value must be between 0 and 255";
        }
        if(req.query.blueValue)
        {
            try
            {
                blueValue = parseInt(req.query.blueValue);
            }
            catch
            {
                error = "Led value can only be numbers";
            }

            if (blueValue<0 || blueValue > 255)
                error = "Led value must be between 0 and 255";
        }

        var j_cmd = {
            "command": "led_manual",
            "payload": {
                "redValue": parseInt(redValue),
                "greenValue": parseInt(greenValue),
                "blueValue": parseInt(blueValue),
            }
        }

        if (error != "")
            j_cmd["error"] = error;

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        res.send("OK!");

        // this.link_manager.on("msg", function(data){
        //     res.send(data);
        // }.bind(this))
    }
}


module.exports = API_Server