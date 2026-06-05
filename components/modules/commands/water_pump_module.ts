import Module from "../module";
import axios from "axios";

class Water_pump_module extends Module {
  private client: any;

  constructor(config: any) {
    super("WATER_PUMP_MODULE", "water_pump_queue", config);

    this.setHandledCmds({
      get_water_pump_status: this.get_water_pump_status.bind(this),
    });

    this.client = axios.create({
      baseURL: `http://${this.CONFIG.pump_ip}`,
      timeout: 3000,
    });
  }

  async get_water_pump_status(command: any) {
    return this.fetchAndRespond("/get_status", "get_water_pump_status", command.id);
  }

  async fetchAndRespond(endpoint: string, commandName: string, id: string) {
    try {
      const { data } = await this.client.get(endpoint);
      return this.sendResponse(commandName, id, data);
    } catch (err: any) {
      return this.sendError(commandName, id, err.message);
    }
  }
}

export default Water_pump_module;
