require('dotenv').config()

var Core = require("./components/core/core");
var core = new Core()

var modules = {
    "client_manager": {
        "path": "./connections/interfacing/client_manager"
    },
    "api_server": {
        "path": "./connections/interfacing/api_server"
    },
    "homekit_server": {
        "path": "./connections/interfacing/homekit"
    },
    "delay": {
        "path": "./components/modules/delay"
    },
    "loop_task": {
        "path": "./components/modules/loop_task"
    },
    "weather_module": {
        "path": "./components/modules/weather_module"
    },
    "water_pump_module": {
        "path": "./components/modules/water_pump_module"
    },
    "led_module": {
        "path": "./components/modules/led_module"
    },
    "info_point": {
        "path": "./components/info_point/info_point"
    },
}

for (mod in modules)
{
    var NewModule = require(modules[mod].path)
    modules[mod]["value"] = new NewModule()
}

