const fs = require('fs');
  
class Builder
{
    make_module()
    {
        this.configs = [];
        fs.readdir("config_build", function (err, files) {
            //handling error
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            } 

            files.forEach(function (file) {
                console.log(file);
                fs.readFile("config_build" +"\\"+ file, 'utf8', (err, data) => {
                    if (err) {
                      console.error(err);
                      return;
                    }

                    var j_data = JSON.parse(data) 
                    var script_into = fs.readFileSync("base_module_conf", "utf8");

                    var shell_script = "";
                    
                    for (var module in j_data.other_modules)
                    {   
                        var script = script_into;
                        console.log(j_data.other_modules[module]);
                        var j_mod = j_data.other_modules[module];
                        var row = "var " + j_mod.name + "= require(\"" + j_mod.path + "\");\n";
                        script += row; 
                        row = "var c_" + j_mod.name + " = new " + j_mod.name + "();\n"
                        script += row; 

                        var module_file = j_mod.name + ".js"
                        
                        shell_script += "node " + module_file + " &\n";

                        fs.writeFile("build/"+ module_file, script, (err) => { 
                            if (err) 
                              console.log(err);
                        });
                    }

                    fs.writeFile("build/start.sh", shell_script, (err) => { 
                        if (err) 
                          console.log(err);
                    });
                    
                  });
            }.bind(this));
        }.bind(this));
    }

}


var builder = new Builder();
builder.make_module()