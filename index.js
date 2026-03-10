require('dotenv').config()

var fs = require('fs');
const { exit } = require('process');
var modules = JSON.parse(fs.readFileSync("conf/modules_config.json", 'utf8'));
var module_params = JSON.parse(fs.readFileSync("conf/params_config.json", 'utf8'));
var interfaces = JSON.parse(fs.readFileSync("conf/interfaces_config.json", 'utf8'));


if(!modules.hasOwnProperty("core"))
{
    console.log("ERROR: Missing core config!");
    console.log("Shuting down...");
    exit();
}

var black_list = ["homekit_server"]

for (mod in modules)
{
    if (black_list.includes(mod))
    {
        console.log("Ignoring: "+ mod);
        continue;
    }
    var NewModule = require(modules[mod].path)

    if(modules[mod].hasOwnProperty("config"))
        modules[mod]["value"] = new NewModule(modules[mod]["config"])
    else
        modules[mod]["value"] = new NewModule()
}

for (int in interfaces)
{
    if (black_list.includes(int))
    {
        console.log("Ignoring: "+ int);
        continue;
    }
    var NewInt = require(interfaces[int].path)
    interfaces[int]["value"] = new NewInt()
}