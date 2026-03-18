const Module = require("../module");

class Help_module extends Module
{
    constructor()
    {   
        super("HELP_MODULE", "help_queue");
        // this.set_handled_cmds({
        //     "list_commands": this.get_available_commands.bind(this)          
        // });
    }

    get_available_commands()
    {
        return {
            "type": "response",
            "command": "list_commands",
            "payload": {}
        }
    }
}

module.exports = Help_module;