const Link_manager = require("../utils/link_manager");
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');

class API_Server
{   
    constructor()
    {
        this.link_manager = new Link_manager("API_SERVER", "api_queue");
        this.link_manager.start();
        this.link_manager.on("msg", this.update_value.bind(this));
        this.link_manager.on("channel_new", this._start.bind(this));

        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());

        this.app.get('/help', this.help.bind(this));
        
        this.app.get('/get_weather', this.handle_weather.bind(this));
        
        this.app.get('/get_led_status', this.handle_led_status.bind(this));
        this.app.post('/manual_led', this.handle_led_req.bind(this));
        this.app.post('/rainbow_start', this.handle_rainbow_start.bind(this));
        this.app.post('/rainbow_stop', this.handle_rainbow_stop.bind(this));

        this.app.post('/set_light', this.handle_set_light.bind(this));

        this.app.get('/get_water_pump_status', this.get_water_pump_status.bind(this));
        this.app.get('/get_water_pump_ambient_temp', this.get_water_pump_ambient_temp.bind(this));

        this.app.listen(process.env.API_PORT, () => console.log("API Server started"));

        this.redValue=0;
        this.greenValue=0;
        this.blueValue=0;
        this.last = null
    }

    _start()
    {
        var j_msg = {
            "type": "managment",
            "command": "response_config",
            "module": "API_SERVER",
            "module_queue": "api_queue",
        }
        this.link_manager.to_core("core_queue", JSON.stringify(j_msg));
    }

    update_value(data)
    {
        this.last = data;
        data = JSON.parse(data);
        if(data.hasOwnProperty("payload"))
        {
            if(data.payload.hasOwnProperty("redValue"))
                this.redValue=data.payload.redValue;
            
            if(data.payload.hasOwnProperty("greenValue"))
                this.greenValue=data.payload.greenValue;
            
            if(data.payload.hasOwnProperty("blueValue"))
                this.blueValue=data.payload.blueValue;
        }
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
        
        var resp_data = {
            "redValue": this.redValue,
            "greenValue": this.greenValue,
            "blueValue": this.blueValue,
        }

        this.inter = setInterval(
            function(){
                console.log("INSIDE", this.last)
                if (this.last == null)
                    return;
                res.send(this.last);
                this.last = null;
                clearInterval(this.inter);
            }.bind(this), 10);
    }

    handle_rainbow_start(req,res)
    {
        var j_cmd = {
            "type": "request",
            "command": "rainbow_start",
            "payload" :{
                "time": 40,
                "brightnes":254
            }
        }

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        this.inter = setInterval(
            function(){
                console.log("INSIDE", this.last)
                if (this.last == null)
                    return;
                res.send(this.last);
                this.last = null;
                clearInterval(this.inter);
            }.bind(this), 10);
    }

    handle_rainbow_stop(req,res)
    {
        var j_cmd = {
            "type": "request",
            "command": "rainbow_stop",            
        }

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        this.inter = setInterval(
            function(){
                console.log("INSIDE", this.last)
                if (this.last == null)
                    return;
                res.send(this.last);
                this.last = null;
                clearInterval(this.inter);
            }.bind(this), 10);
    }

    handle_set_light(req, res)
    {
        console.log(req.body)
        var j_cmd = {
                "type": "request", 
                "command": "",
            };
        if(req.body.light_on)
            j_cmd["command"] = "light_on"
        else
            j_cmd["command"] = "light_off"

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));

        this.inter = setInterval(
            function(){
                console.log("INSIDE", this.last)
                if (this.last == null)
                    return;
                res.send(this.last);
                this.last = null;
                clearInterval(this.inter);
            }.bind(this), 10);
    }

    handle_weather(req,res)
    {
        var j_cmd = {
            "type": "request", 
            "command": "get_weather",
        };

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        
        this.inter = setInterval(
            function(){
                console.log("INSIDE", this.last)
                if (this.last == null)
                    return;
                res.send(this.last);
                this.last = null;
                clearInterval(this.inter);
            }.bind(this), 10);
    }

    handle_led_status(req,res)
    {
        var j_cmd = {
            "type": "request", 
            "command": "led_status",
        };

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        
        this.inter = setInterval(
            function(){
                console.log("INSIDE", this.last)
                if (this.last == null)
                    return;
                res.send(this.last);
                this.last = null;
                clearInterval(this.inter);
            }.bind(this), 10);
    }

    get_water_pump_status(req,res)
    {
        var j_cmd = {
            "type": "request", 
            "command": "get_water_pump_status",
        };

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        
        this.inter = setInterval(
            function(){
                console.log("INSIDE", this.last)
                if (this.last == null)
                    return;
                res.send(this.last);
                this.last = null;
                clearInterval(this.inter);
            }.bind(this), 10);
    }

    get_water_pump_ambient_temp(req,res)
    {
        var j_cmd = {
            "type": "request", 
            "command": "get_water_pump_ambient_temp",
        };

        this.link_manager.to_core("core_queue", JSON.stringify(j_cmd));
        
        this.inter = setInterval(
            function(){
                console.log("INSIDE", this.last)
                if (this.last == null)
                    return;
                res.send(this.last);
                this.last = null;
                clearInterval(this.inter);
            }.bind(this), 10);
    }

    help(req, res)  
    {
        var route,routes = [];
        process.env.DEBUG?console.log("Get help request"):"";
        try
        {
            this.app._router.stack.forEach(function(middleware)
            {
                if(middleware.route)
                { // routes registered directly on the app
                    routes.push(middleware.route);
                } 
                else if(middleware.name === 'router')
                { // router middleware 
                    middleware.handle.stack.forEach(function(handler)
                    {
                        route = handler.route;
                        route && routes.push(route);
                    });
                }
            });

            process.env.DEBUG?console.log(routes):"";
            res.send(routes);
        }
        catch(e)
        {
            console.error("Error: "+e);
            jres = {success:"0", value: {error: e} }
            res.send(jres);
        }
    }
}


module.exports = API_Server