const Module = require("../module");
const axios = require("axios");

class Crypto_module extends Module {
  constructor() {
    super("CRYPTO_MODULE", "crypto_queue");

    this.set_handled_cmds({
      get_crypto_data: this.get_crypto_data.bind(this),
    });

    this.client = axios.create({
      baseURL: "https://api.freecryptoapi.com/v1",
      timeout: 3000,
    });
  }

  async get_crypto_data(command){
    return this.fetchAndRespond("/getData", "get_crypto_data", command);
  }

  async fetchAndRespond(endpoint, commandName, command) {
    try {
      const { data } = await this.client.get(endpoint, {
        params: {
          symbol: "BTC + SOL",
        },
        headers: {
          Authorization: `Bearer ${process.env.CRYPTO_API_KEY}`,
          Accept: "*/*",
        },
      });

      this.log.debug(JSON.stringify(data.symbols))

      return this.sendResponse(commandName, data.symbols);
    } catch (err) {
      this.log?.error("Error fetching crypto data:", err.message);
      return this.sendError(commandName, err.message);
    }
  }

}

module.exports = Crypto_module;