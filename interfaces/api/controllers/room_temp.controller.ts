import type { Request, Response } from 'express'
import { CoreService } from '../services/core.service'

export class RoomTempController {
    constructor(private core: CoreService) {}

    async getRoomTemp(req: Request, res: Response): Promise<void> {
        const response = await this.core.sendCommand({
            id: crypto.randomUUID(),
            type: 'request',
            command: 'get_room_temp',
        })
        res.json(response)
    }
}
