import LinkManager from '../../../utils/link_manager'
import { interfaceLogger } from '../../../utils/logger'
import { CoreCommand } from '../types/commands'
import { CoreResponse } from '../types/responses'


export class CoreService {
    private logger: any
    private linkManager: LinkManager

    // RGB state
    public redValue = 0
    public greenValue = 0
    public blueValue = 0

    // queue di resolver per le response
    private pending = new Map<string, (v:any)=>void>()

    constructor() 
    {
        this.logger = interfaceLogger('HTTP_API')

        this.linkManager = new LinkManager(
            'API_SERVER',
            'api_queue',
            (msg: string) => this.logger.debug(msg)
        )

        this.linkManager.start()
        this.linkManager.on('msg', this.updateValue.bind(this))
        this.linkManager.on('channel_new', this.start.bind(this))
    }

    // ================= CORE INIT =================

    private start(): void {
        const message = {
            type: 'managment',
            command: 'response_config',
            module: 'API_SERVER',
            module_queue: 'api_queue',
        }

        this.linkManager.toCore( 'core_queue', JSON.stringify(message))
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
        this.linkManager.toCore('core_queue', JSON.stringify(command))
    }

    // ================= RESPONSE HANDLER =================

    waitForResponse(id: string): Promise<any> {
        return new Promise((resolve) => {
            this.pending.set(id, resolve)
        })
    }
}