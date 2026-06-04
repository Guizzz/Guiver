
import type { Request, Response } from 'express'
import { CoreService } from '../services/core.service'
import { CoreCommand } from '../types/commands';

export class WaterController {
    constructor( private core: CoreService) {}

    async getPumpStatus(req: Request, res: Response): Promise<void> 
    {   
        const id = crypto.randomUUID();
        const cmd : CoreCommand = {
            id: id,
            type: 'request',
            command: 'get_water_pump_status',
        };
        this.core.sendCommand(cmd)

        const response = await this.core.waitForResponse(id)

        res.json(response)
    }


}