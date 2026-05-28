import LinkManager from "../../utils/link_manager";
import { moduleLogger } from "../../utils/logger";
import { Logger } from "winston";

type CommandHandler = ( msg: any ) => Promise<any> | any;

class Module {
    protected moduleName: string;
    protected moduleQueue: string;

    protected log: Logger;

    protected CONFIG: Record<string, any>;

    protected commandsHandled: Record< string, CommandHandler >;

    protected linkManager: LinkManager;

    constructor( moduleName: string, moduleQueue: string, config: Record<string, any> = {}) 
    {
        this.moduleName = moduleName;
        this.moduleQueue = moduleQueue;

        this.log = moduleLogger(this.moduleName);

        this.CONFIG = config;

        if (Object.keys(this.CONFIG).length > 0) {
            this.log.info(
                "Config loaded: " +
                JSON.stringify(config)
            );
        }

        this.commandsHandled = {};

        this.linkManager = new LinkManager(
            moduleName,
            moduleQueue,
            (m: string) => this.log.info(m)
        );

        this.linkManager.on(
            "msg",
            this.manageRequest.bind(this)
        );

        this.linkManager.start();
    }

    protected setHandledCmds(
        commandsHandled: Record<
            string,
            CommandHandler
        >
    ): void {
        this.commandsHandled = commandsHandled;

        this.linkManager.on(
            "channel_new",
            this._start.bind(this)
        );
    }

    private _start(): void {
        const cmds = Object.keys(
            this.commandsHandled
        );

        const j_msg = {
            type: "managment",
            command: "module_config",
            module: this.moduleName,
            module_queue: this.moduleQueue,
            commands_handled: cmds
        };

        this.linkManager.toCore(
            "core_queue",
            JSON.stringify(j_msg)
        );
    }

    protected async manageRequest(
        message: string
    ): Promise<void> {
        this.log.debug(
            "Message received: " + message
        );

        const j_msg = JSON.parse(message);

        const req_cmd =
            j_msg.command.trim();

        if (
            this.commandsHandled.hasOwnProperty(
                req_cmd
            )
        ) {
            const cmdManager =
                this.commandsHandled[req_cmd];

            const data = await cmdManager(
                j_msg
            );

            if (
                data !== undefined &&
                JSON.stringify(data) !== "{}"
            ) {
                this.linkManager.toCore(
                    "core_queue",
                    JSON.stringify(data)
                );
            }

            return;
        }

        this.log.error(
            `Command [${req_cmd}] not implemented`
        );

        j_msg.payload =
            `ERROR: Command [${req_cmd}] not implemented`;

        j_msg.error = 500;

        this.linkManager.toCore(
            "core_queue",
            JSON.stringify(j_msg)
        );
    }

    protected sendResponse(
        command: string,
        id: string,
        payload: any
    ): void {
        const resp = {
            id,
            type: "response",
            command,
            payload,
            timestamp: Date.now()
        };

        this.linkManager.toCore(
            "core_queue",
            JSON.stringify(resp)
        );
    }

    protected sendRequest(
        command: string,
        payload: any
    ): void {
        const resp = {
            type: "request",
            command,
            payload
        };

        this.linkManager.toCore(
            "core_queue",
            JSON.stringify(resp)
        );
    }

    protected sendError(
        command: string,
        err: any
    ): void {
        const resp = {
            type: "response",
            command,
            error: err,
            timestamp: Date.now()
        };

        this.linkManager.toCore(
            "core_queue",
            JSON.stringify(resp)
        );
    }
}

export default Module;