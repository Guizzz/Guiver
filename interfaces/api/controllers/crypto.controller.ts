import type { Request, Response } from 'express'
import { CoreService } from '../services/core.service'
import { CoreCommand } from '../types/commands'

export class CryptoController {
    constructor(private core: CoreService) {}

    async getCryptoData(req: Request, res: Response): Promise<void> {
        const id = crypto.randomUUID()
        const cmd: CoreCommand = {
            id,
            type: 'request',
            command: 'get_crypto_data',
        }

        this.core.sendCommand(cmd)
        const response = await this.core.waitForResponse(id)
        res.json(response)
    }
}
