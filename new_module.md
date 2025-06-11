## Define new module
Guiver can be fast integrated with new feature, to handle new commands and requests.

### All you need is:

1. Create new file under `components/module/<MODULE_NAME>_module.js`. 

2. Import `Module` class from the same dir.
```js
const Module = require("./module");
```

3. Define a class for your new module that extends `Module`.
4. Define a `constructor()` and inside you have to configure some stuff.

Frist of all, you have to call `super` function, where you define:
- The name of the new module.
- The queue where _core_ process can send the request to your module. 
```js
constructor()
{
    super("<MODULE_NAME>_MODULE", "<MODULE_NAME>_queue");
    ...
}
```
5. Now you have to define the commands name and their callback function.
```js
constructor()
{
    super("WATER_PUMP_MODULE", "water_pump_queue");
    this.set_handled_cmds({
        "<command_name>": this.callback.bind(this),
    });
}
```
6. Implements your callback, and that's it!
