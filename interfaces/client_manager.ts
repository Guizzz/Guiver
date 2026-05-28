import LinkManager from "../utils/link_manager";
import { interfaceLogger } from "../utils/logger";
import WssManager from "../utils/wss_manager";

class ClientManager {
    private logger: any;
    private linkManager: LinkManager;
    private wssManager: WssManager;

    constructor() {
        this.logger = interfaceLogger("WSS_CLIENTS");

        this.linkManager = new LinkManager(
            "CLNT_MGMT",
            "clients_queue",
            (msg: string) => this.logger.debug(msg)
        );

        this.wssManager = new WssManager(
            process.env.WSS_CLI_PORT!,
            "ws_msg",
            (msg: string) => this.logger.debug(msg)
        );

        this.linkManager.start();
        this.wssManager.start();

        this.wssManager.on("ws_msg", this.fromClient.bind(this));
        this.linkManager.on("msg", this.sendClient.bind(this));
        this.linkManager.on("channel_new", this._start.bind(this));
    }

    private _start(): void {
        const j_msg = {
            type: "managment",
            command: "response_config",
            module: "CLNT_MGMT",
            module_queue: "clients_queue"
        };

        this.linkManager.toCore(
            "core_queue",
            JSON.stringify(j_msg)
        );
    }

    private fromClient(msg: string): void {
        this.linkManager.toCore("core_queue", msg);
    }

    private sendClient(msg: string): void {
        this.logger.info(msg);

        this.wssManager.sendResponse(msg);
    }
}

export default ClientManager;