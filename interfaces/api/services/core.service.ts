import EventBus from '../../../utils/event_bus'
import { interfaceLogger } from '../../../utils/logger'
import { CoreCommand } from '../types/commands'
import { CoreResponse } from '../types/responses'


export class CoreService {
    private logger: any

    // RGB state
    public redValue = 0
    public greenValue = 0
    public blueValue = 0

    // queue di resolver per le response
    private pending = new Map<string, (v:any)=>void>()

    constructor() 
    {
        this.logger = interfaceLogger('HTTP_API')

        EventBus.subscribe('core:response', this.updateValue.bind(this))
        this._start()
    }

    // ================= CORE INIT =================

    private _start(): void {
        const message = {
            type: 'managment',
            command: 'response_config',
            module: 'API_SERVER',
            module_queue: 'api_queue',
        }

        EventBus.publish('core:register_handler', message)
    }

    // ================= MESSAGE HANDLER =================

    private updateValue(data: CoreResponse): void 
    {
        // aggiorna stato RGB
        if (data.payload) {
            this.redValue =
                data.payload.redValue ??
                this.redValue

            this.greenValue =
                data.payload.greenValue ??
                this.greenValue

            this.blueValue =
                data.payload.blueValue ??
                this.blueValue
        }

        // risolvi la prossima promise in attesa
        const resolver = this.pending.get(data.id)

        if (resolver) {
            resolver(data)
            this.pending.delete(data.id)
        }
    }

    // ================= COMMAND API =================

    sendCommand(command: CoreCommand): void 
    {
        EventBus.publish('core:request', command)
    }

    // ================= RESPONSE HANDLER =================

    waitForResponse(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.pending.set(id, resolve)
        })
    }
}
