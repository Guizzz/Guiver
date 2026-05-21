import { Request, Response } from 'express'
import { CoreService } from '../services/core.service'
import { CoreCommand } from '../types/commands'

export class LedController {
    constructor( private core: CoreService) {}

    async getStatus(req: Request, res: Response): Promise<void> 
    {
        const id = crypto.randomUUID();
        const cmd : CoreCommand = {
            id: id,
            type: 'request',
            command: 'led_status',
        }

        this.core.sendCommand(cmd)
        const response = await this.core.waitForResponse(id)
        res.json(response)
    }

    async manual( req: Request, res: Response ): Promise<void | Response> 
    {
        const {
            redValue = 0,
            greenValue = 0,
            blueValue = 0,
        } = req.body

        const isValid = [
            redValue,
            greenValue,
            blueValue,
        ].every((v) => Number.isInteger(v) && v >= 0 && v < 256)

        if (!isValid) 
        {
            return res.status(400).send( 'Invalid RGB values (0-255)')
        }

        const id = crypto.randomUUID();
        const cmd : CoreCommand = {
            id: id,
            type: 'request',
            command: 'led_manual',
            payload: {
                redValue,
                greenValue,
                blueValue,
            },
        }; 
        this.core.sendCommand(cmd)

        const response = await this.core.waitForResponse(id)

        res.json(response)
    }

    async setRainbow(req: Request, res: Response ): Promise<void> 
    {   
        const id = crypto.randomUUID();
        const cmd: CoreCommand = {
            id : id,
            type: 'request',
            command: req.body.rainbow_run
                ? 'rainbow_start'
                : 'rainbow_stop',
            payload: req.body.rainbow_run
                ? {
                    time: 40,
                    brightnes: 254,
                }
                : undefined,
        }

        this.core.sendCommand(cmd)

        const response = await this.core.waitForResponse(id)

        res.json(response)
    }
}