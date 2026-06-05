
import type { Request, Response } from 'express'
import { CoreService } from '../services/core.service'

export class WaterController {
    constructor( private core: CoreService) {}

    async getPumpStatus(req: Request, res: Response): Promise<void> 
    {   
        const response = await this.core.sendCommand({
            id: crypto.randomUUID(),
            type: 'request',
            command: 'get_water_pump_status',
        })
        res.json(response)
    }


}