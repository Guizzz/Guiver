var Client_Manager = require("./components/clients_manager/client_manager");
var Core = require("./components/core/core");
require('dotenv').config()

const Ext_Module_Manager = require("./components/ext_modules_manager/ext_modules_manager");
const Led_module = require("./modules/led_module");
const Weather_module = require("./modules/weather_module");

var core = new Core()
var client_manager = new Client_Manager()

var ext_module_manager = new Ext_Module_Manager();
var wether = new Weather_module();
// var led = new Led_module();