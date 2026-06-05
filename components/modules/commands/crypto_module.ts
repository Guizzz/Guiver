import Module from "../module";
import axios from "axios";

class Crypto_module extends Module {
  private client: any;

  constructor() {
    super("CRYPTO_MODULE", "crypto_queue");

    this.setHandledCmds({
      get_crypto_data: this.get_crypto_data.bind(this),
    });

    this.client = axios.create({
      baseURL: "https://api.coincap.io/v2",
      timeout: 3000,
    });
  }

  async get_crypto_data(command: any) {
    return this.fetchAndRespond("get_crypto_data", command, command.id);
  }

  async fetchAndRespond(commandName: string, command: any, id: string) {
    try {
      const { data } = await this.client.get("/assets", {
        params: {
          ids: "bitcoin,solana",
        },
      });

      this.log.debug(JSON.stringify(data.data));

      return this.sendResponse(commandName, id, data.data);
    } catch (err: any) {
      this.log?.error("Error fetching crypto data:", err.message);
      return this.sendError(commandName, id, err.message);
    }
  }
}

export default Crypto_module;
