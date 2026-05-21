import type { Request, Response} from 'express'
import { CoreService } from '../services/core.service'
import { CoreCommand } from '../types/commands'

export class RelayController 
{
    constructor( private core: CoreService ) {}

    async setRelay( req: Request, res: Response ): Promise<void> 
    {
        const { set_relay, relay } = req.body;
        const id = crypto.randomUUID();
        
        const cmd : CoreCommand = {
            id: id,
            type: 'request',
            command: 'set_relay',
            payload: {
                set_relay,
                relay,
            }
        }
         
        this.core.sendCommand(cmd)

        const response = await this.core.waitForResponse(id)

        res.json(response)
    }

    async getRelayStatus(req: Request, res: Response): Promise<void> 
    {   
        const id = crypto.randomUUID();

        this.core.sendCommand({
            id: id,
            type: 'request',
            command: 'relay_status',
        })

        const response = await this.core.waitForResponse(id)

        res.json(response)
    }
}