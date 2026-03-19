const Module = require("../module");
const axios = require("axios");

class Weather_module extends Module {
  constructor() {
    super("WEATHER_MODULE", "weather_queue");

    this.set_handled_cmds({
      get_weather: this.get_weather.bind(this),
    });

    this.client = axios.create({
      baseURL: "https://api.openweathermap.org/data/2.5",
      timeout: 3000,
    });
  }

  async get_weather(command) {
    return this.fetchAndRespond("/weather", "get_weather", command);
  }

  async fetchAndRespond(endpoint, commandName, command) 
  {
    try {
      const city = command?.payload?.city || "latina";
      const apiKey = process.env.WEATHER_KEY;

      const { data } = await this.client.get(endpoint, {
        params: {
          q: city,
          units: "metric",
          appid: apiKey,
        },
      });

      // payload ridotto (molto importante)
      const payload = {
        city: data.name,
        temp: data.main.temp,
        humidity: data.main.humidity,
        weather: data.weather[0].description,
      };

      return this.sendResponse(commandName, payload);

    } 
    catch (err) 
    {
      return this.sendError(commandName, err);
    }
  }
}

module.exports = Weather_module;