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
            //listing all files using forEach
            files.forEach(function (file) {
                console.log(file);
                // Do whatever you want to do with the file
                fs.readFile("config_build" +"\\"+ file, 'utf8', (err, data) => {
                    if (err) {
                      console.error(err);
                      return;
                    }

                    var j_data = JSON.parse(data) 
                    
                    
                    var script = fs.readFileSync("base_module_conf", "utf8");

                    for (var module in j_data.other_modules)
                    {
                        console.log(module);
                        var j_mod = JSON.parse(module);
                        var row = "var " + j_mod.name + "= require(\"" + j_mod.path + "\");\n";
                        script += row; 
                        row = "var c_" + j_mod.name + " = new " + j_mod.name + "();\n"
                        script += row; 
                    }

                    fs.writeFile("build/"+j_data.name + ".js", script, (err) => { 
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