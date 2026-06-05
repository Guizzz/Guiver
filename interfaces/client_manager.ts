import EventBus from "../utils/event_bus";
import { interfaceLogger } from "../utils/logger";
import WssManager from "../utils/wss_manager";

class ClientManager {
    private logger: any;
    private wssManager: WssManager;

    constructor() {
        this.logger = interfaceLogger("WSS_CLIENTS");

        this.wssManager = new WssManager(
            process.env.WSS_CLI_PORT!,
            "ws_msg",
            (msg: string) => this.logger.debug(msg)
        );

        this.wssManager.start();

        this.wssManager.on("ws_msg", this.fromClient.bind(this));
        EventBus.subscribe("core:response", this.sendClient.bind(this));

        this._start();
    }

    private _start(): void {
        const j_msg = {
            type: "managment",
            command: "response_config",
            module: "CLNT_MGMT",
            module_queue: "clients_queue"
        };

        EventBus.publish("core:register_handler", j_msg);
    }

    private fromClient(msg: string): void {
        try {
            const parsed = JSON.parse(msg);
            EventBus.publish("core:request", parsed);
        } catch {
            this.logger.error("Invalid JSON from client");
        }
    }

    private sendClient(msg: any): void {
        this.logger.info(JSON.stringify(msg));
        this.wssManager.sendResponse(JSON.stringify(msg));
    }
}

export default ClientManager;
