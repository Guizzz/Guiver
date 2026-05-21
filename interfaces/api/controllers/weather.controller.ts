import type {Request,Response} from 'express'
import { CoreService } from '../services/core.service'
import { CoreCommand } from '../types/commands';


export class WeatherController 
{
    constructor(private core: CoreService) {}

    async getWeather(req: Request,res: Response): Promise<void> 
    {
        const id = crypto.randomUUID();
        const cmd : CoreCommand = {
            id: id,
            type: 'request',
            command: 'get_weather',
        }

        this.core.sendCommand(cmd);
        const response = await this.core.waitForResponse(id)
        res.json(response)
    }
}