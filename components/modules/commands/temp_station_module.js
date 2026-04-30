const Module = require("../module");
const axios = require("axios");

class TempStation_module extends Module {
  constructor(config) {
    super("ROOM_TEMP_MODULE", "room_temp_queue", config);

    this.set_handled_cmds({
      get_room_temp: this.get_room_temp.bind(this)
    });

    this.client = axios.create({
      baseURL: `http://192.168.1.158`,
      timeout: 3000,
    });
  }

  async get_room_temp(command) {
    return this.fetchAndRespond("/get_temp", "get_room_temp");
  }

  async fetchAndRespond(endpoint, commandName) 
  {
    try {
      const { data } = await this.client.get(endpoint);
      return this.sendResponse(commandName, data);
    } 
    catch (err) 
    {
      return this.sendError(commandName, err.message);
    }
  }
}

module.exports = TempStation_module;