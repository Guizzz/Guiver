import { Express } from 'express'
import { CoreService } from '../services/core.service'
import { WeatherController } from '../controllers/weather.controller'


export function registerWeatherRoutes( app: Express, core: CoreService): void 
{
    const controller = new WeatherController(core)
    app.get( '/get_weather', controller.getWeather.bind(controller))
}