require('dotenv').config()
var Core = require("./components/core/core");
var core = new Core()

var Client_Manager = require("./connections/interfacing/client_manager");
var client_manager = new Client_Manager()

const API_Server = require("./connections/interfacing/api_server");
var api_server = new API_Server();

const Delay_module = require("./components/modules/delay");
var delay_mdl = new Delay_module();

const Weather_module = require("./components/modules/weather_module");
var wether = new Weather_module();

// const Ext_Module_Manager = require("./components/ext_modules_manager/ext_modules_manager");
// var ext_module_manager = new Ext_Module_Manager();

const Led_module = require("./components/modules/led_module");
var led = new Led_module();