import Module from "../module";
import axios from "axios";

class RoomTemp_module extends Module {
  private client: any;

  constructor(config: any) {
    super("ROOM_TEMP_MODULE", "room_temp_queue", config);

    this.setHandledCmds({
      get_room_temp: this.get_room_temp.bind(this),
    });

    this.client = axios.create({
      baseURL: `http://192.168.1.158`,
      timeout: 3000,
    });
  }

  async get_room_temp(command: any) {
    return this.fetchAndRespond("/get_temp", "get_room_temp", command.id);
  }

  async fetchAndRespond(endpoint: string, commandName: string, id: string) {
    try {
      const { data } = await this.client.get(endpoint);
      return this.sendResponse(commandName, id, data);
    } catch (err: any) {
      return this.sendError(commandName, err.message);
    }
  }
}

export default RoomTemp_module;
