import type { Request, Response } from 'express'
import { CoreService } from '../services/core.service'
import { CoreCommand } from '../types/commands'

export class RoomTempController {
    constructor(private core: CoreService) {}

    async getRoomTemp(req: Request, res: Response): Promise<void> {
        const id = crypto.randomUUID()
        const cmd: CoreCommand = {
            id,
            type: 'request',
            command: 'get_room_temp',
        }

        this.core.sendCommand(cmd)
        const response = await this.core.waitForResponse(id)
        res.json(response)
    }
}
