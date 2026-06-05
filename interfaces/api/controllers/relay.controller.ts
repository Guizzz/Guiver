import type { Request, Response} from 'express'
import { CoreService } from '../services/core.service'

export class RelayController 
{
    constructor( private core: CoreService ) {}

    async setRelay( req: Request, res: Response ): Promise<void> 
    {
        const { set_relay, relay } = req.body;
        
        const response = await this.core.sendCommand({
            id: crypto.randomUUID(),
            type: 'request',
            command: 'set_relay',
            payload: {
                set_relay,
                relay,
            }
        })
        res.json(response)
    }

    async getRelayStatus(req: Request, res: Response): Promise<void> 
    {   
        const response = await this.core.sendCommand({
            id: crypto.randomUUID(),
            type: 'request',
            command: 'relay_status',
        })
        res.json(response)
    }
}