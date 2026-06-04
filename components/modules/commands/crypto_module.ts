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
      baseURL: "https://api.freecryptoapi.com/v1",
      timeout: 3000,
    });
  }

  async get_crypto_data(command: any) {
    return this.fetchAndRespond("/getData", "get_crypto_data", command, command.id);
  }

  async fetchAndRespond(endpoint: string, commandName: string, command: any, id: string) {
    try {
      const { data } = await this.client.get(endpoint, {
        params: {
          symbol: "BTC + SOL",
        },
        headers: {
          Authorization: `Bearer ${process.env.CRYPTO_API_KEY || ""}`,
          Accept: "*/*",
        },
      });

      this.log.debug(JSON.stringify(data.symbols));

      return this.sendResponse(commandName, id, data.symbols);
    } catch (err: any) {
      this.log?.error("Error fetching crypto data:", err.message);
      return this.sendError(commandName, err.message);
    }
  }
}

export default Crypto_module;
