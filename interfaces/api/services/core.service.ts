import LinkManager from '../../../utils/link_manager'
import { interfaceLogger } from '../../../utils/logger'
import { CoreCommand } from '../types/commands'
import { CoreResponse } from '../types/responses'


export class CoreService {
    private logger: any
    private link_manager: any

    // RGB state
    public redValue = 0
    public greenValue = 0
    public blueValue = 0

    // queue di resolver per le response
    private pending = new Map<string, (v:any)=>void>()

    constructor() 
    {
        this.logger = interfaceLogger('HTTP_API')

        this.link_manager = new LinkManager(
            'API_SERVER',
            'api_queue',
            (msg: string) =>
                this.logger.debug(msg)
        )

        this.link_manager.start()
        this.link_manager.on('msg', this.updateValue.bind(this))
        this.link_manager.on('channel_new', this.start.bind(this))
    }

    // ================= CORE INIT =================

    private start(): void {
        const message = {
            type: 'managment',
            command: 'response_config',
            module: 'API_SERVER',
            module_queue: 'api_queue',
        }

        this.link_manager.to_core( 'core_queue', JSON.stringify(message))
    }

    // ================= MESSAGE HANDLER =================

    private updateValue(data: string): void 
    {
        const parsed: CoreResponse = JSON.parse(data)

        // aggiorna stato RGB
        if (parsed.payload) {
            this.redValue =
                parsed.payload.redValue ??
                this.redValue

            this.greenValue =
                parsed.payload.greenValue ??
                this.greenValue

            this.blueValue =
                parsed.payload.blueValue ??
                this.blueValue
        }

        // risolvi la prossima promise in attesa
        const resolver = this.pending.get(parsed.id)

        if (resolver) {
            resolver(parsed)
            this.pending.delete(parsed.id)
        }
    }

    // ================= COMMAND API =================

    sendCommand(command: CoreCommand): void 
    {
        this.link_manager.to_core('core_queue', JSON.stringify(command))
    }

    // ================= RESPONSE HANDLER =================

    waitForResponse(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.pending.set(id, resolve)
        })
    }
}