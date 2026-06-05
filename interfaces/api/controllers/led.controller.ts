import { Request, Response } from 'express'
import { CoreService } from '../services/core.service'

export class LedController {
    constructor( private core: CoreService) {}

    async getStatus(req: Request, res: Response): Promise<void> 
    {
        const response = await this.core.sendCommand({
            id: crypto.randomUUID(),
            type: 'request',
            command: 'led_status',
        })
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

        const response = await this.core.sendCommand({
            id: crypto.randomUUID(),
            type: 'request',
            command: 'led_manual',
            payload: {
                redValue,
                greenValue,
                blueValue,
            },
        })
        res.json(response)
    }

    async setRainbow(req: Request, res: Response ): Promise<void> 
    {   
        const response = await this.core.sendCommand({
            id: crypto.randomUUID(),
            type: 'request',
            command: req.body.run_rainbow
                ? 'rainbow_start'
                : 'rainbow_stop',
            payload: req.body.run_rainbow
                ? {
                    time: 40,
                    brightnes: 254,
                }
                : undefined,
        })
        res.json(response)
    }
}