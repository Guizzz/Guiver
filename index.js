require('dotenv').config()

var fs = require('fs');
var modules = JSON.parse(fs.readFileSync("components/all_modules.json", 'utf8'));

var white_list = ["homekit_server"]

for (mod in modules)
{
    if (!white_list.includes(mod))
    {
        console.log("Ignoring: "+ mod);
        continue;
    }
    var NewModule = require(modules[mod].path)
    modules[mod]["value"] = new NewModule()
}

