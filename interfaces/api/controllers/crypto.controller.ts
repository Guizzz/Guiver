import type { Request, Response } from 'express'
import { CoreService } from '../services/core.service'

export class CryptoController {
    constructor(private core: CoreService) {}

    async getCryptoData(req: Request, res: Response): Promise<void> {
        const response = await this.core.sendCommand({
            id: crypto.randomUUID(),
            type: 'request',
            command: 'get_crypto_data',
        })
        res.json(response)
    }
}
