import Module from "../module";
import axios from "axios";

class Weather_module extends Module {
  private client: any;

  constructor() {
    super("WEATHER_MODULE", "weather_queue");

    this.setHandledCmds({
      get_weather: this.get_weather.bind(this),
    });

    this.client = axios.create({
      baseURL: "https://api.openweathermap.org/data/2.5",
      timeout: 3000,
    });
  }

  async get_weather(command: any) {
    return this.fetchAndRespond("/weather", "get_weather", command, command.id);
  }

  async fetchAndRespond(endpoint: string, commandName: string, command: any, id: string) {
    try {
      const city = command?.payload?.city || "latina";
      const apiKey = process.env.WEATHER_KEY || "";

      const { data } = await this.client.get(endpoint, {
        params: {
          q: city,
          units: "metric",
          appid: apiKey,
        },
      });

      const payload = {
        city: data.name,
        temp: data.main.temp,
        humidity: data.main.humidity,
        weather: data.weather[0].description,
      };

      return this.sendResponse(commandName, id, payload);
    } catch (err: any) {
      return this.sendError(commandName, err.message);
    }
  }
}

export default Weather_module;
