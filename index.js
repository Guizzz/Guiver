var  Client_Manager = require("./components/clients_manager/client_manager");
var Core = require("./components/core/core");
const Ext_Module_Manager = require("./components/ext_modules_manager/ext_modules_manager");
const Wether_module = require("./modules/wether_modules");
require('dotenv').config()

var core = new Core()
var client_manager = new Client_Manager()
var ext_module_manager = new Ext_Module_Manager();
var wether = new Wether_module();
