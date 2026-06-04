const Module = require("../module").default;
const axios = require("axios");

class Water_pump_module extends Module {
  constructor(config) {
    super("WATER_PUMP_MODULE", "water_pump_queue", config);

    this.setHandledCmds({
      get_water_pump_status: this.get_water_pump_status.bind(this),
    });

    this.client = axios.create({
      baseURL: `http://${this.CONFIG.pump_ip}`,
      timeout: 3000,
    });
  }

  async get_water_pump_status(command) {
    return this.fetchAndRespond("/get_status", "get_water_pump_status", command.id);
  }

  async fetchAndRespond(endpoint, commandName, id) 
  {
    try {
      const { data } = await this.client.get(endpoint);
      return this.sendResponse(commandName, id, data);
    } 
    catch (err) 
    {
      return this.sendError(commandName, err.message);
    }
  }
}

module.exports = Water_pump_module;