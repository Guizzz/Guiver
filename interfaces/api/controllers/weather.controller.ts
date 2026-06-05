import type {Request,Response} from 'express'
import { CoreService } from '../services/core.service'


export class WeatherController 
{
    constructor(private core: CoreService) {}

    async getWeather(req: Request,res: Response): Promise<void> 
    {
        const response = await this.core.sendCommand({
            id: crypto.randomUUID(),
            type: 'request',
            command: 'get_weather',
        })
        res.json(response)
    }
}