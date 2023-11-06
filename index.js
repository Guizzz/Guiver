var  Client_Manager = require("./components/clients_manager/client_manager");
var Core = require("./components/core/core");
const Wether_module = require("./modules/wether_modules");

var client_manager = new Client_Manager()
var core = new Core()
var wether = new Wether_module();

wether.start();
core.start();
