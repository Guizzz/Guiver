const Link_manager = require("../../connections/link_manager");
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');

class API_Server
{   
    constructor()
    {
        this.link_manager = new Link_manager("CLNT_MGMT", "clients_queue");
        this.link_manager.start();
        this.link_manager.on("msg", this.send_client.bind(this));
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());

        this.app.post('/manual_led', this.handle_led_req.bind(this));

        this.app.listen(process.env.API_PORT, () => console.log("API Server started"));
    }

    handle_led_req(req,res)
    {
        var redValue = 0;
        var greenValue = 0;
        var blueValue = 0;
        if(req.query.redValue)
            redValue = req.query.redValue;
        if(req.query.greenValue)
        greenValue = req.query.greenValue;
        if(req.query.blueValue)
            blueValue = req.query.blueValue;

        var j_cmd = {
            "command": "led_manual",
            "payload": {
                "RedLed": redValue,
                "GreenLed": greenValue,
                "BlueLed": blueValue,
            }
        }

        this.link_manager.to_core("core_queue", j_cmd);
    }
}


module.exports = API_Server