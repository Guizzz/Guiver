import EventBus from "../../utils/event_bus";
import { moduleLogger } from "../../utils/logger";
import { Logger } from "winston";

type CommandHandler = ( msg: any ) => Promise<any> | any;

class Module {
    protected moduleName: string;
    protected moduleQueue: string;

    protected log: Logger;

    protected CONFIG: Record<string, any>;

    protected commandsHandled: Record< string, CommandHandler >;

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
    }

    protected setHandledCmds(
        commandsHandled: Record<
            string,
            CommandHandler
        >
    ): void {
        this.commandsHandled = commandsHandled;

        EventBus.subscribe(
            "module:" + this.moduleQueue,
            this.manageRequest.bind(this)
        );

        this._start();
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

        EventBus.publish("core:register", j_msg);
    }

    protected async manageRequest(
        j_msg: any
    ): Promise<void> {
        this.log.debug(
            "Message received: " + JSON.stringify(j_msg)
        );

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
                EventBus.publish("core:request", data);
            }

            return;
        }

        this.log.error(
            `Command [${req_cmd}] not implemented`
        );

        j_msg.payload =
            `ERROR: Command [${req_cmd}] not implemented`;

        j_msg.error = 500;

        EventBus.publish("core:request", j_msg);
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

        EventBus.publish("core:request", resp);
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

        EventBus.publish("core:request", resp);
    }

    protected sendError(
        command: string,
        id: string | undefined,
        err: any
    ): void {
        const resp: Record<string, any> = {
            type: "response",
            command,
            error: err,
            timestamp: Date.now()
        };

        if (id) { resp.id = id; }

        EventBus.publish("core:request", resp);
    }
}

export default Module;