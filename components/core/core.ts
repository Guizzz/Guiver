import LinkManager from "../../utils/link_manager";
import { coreLogger } from "../../utils/logger";

interface MessagePayload
{
    command?: string;
    type?: "request" | "managment" | "response";
    payload?: any;
    error?: any;
    module_queue?: string;
    commands_handled?: string[];

    [key: string]: any;
}

type ManagementHandler = (config: MessagePayload) => void;

export default class Core
{
    private link_manager: LinkManager;
    private command_handled: Record<string, string>;
    private response_handlers: string[];
    private managment_handlers: Record<string, ManagementHandler>;

    constructor()
    {
        this.link_manager = new LinkManager( "CORE", "core_queue", (msg: string) => coreLogger.debug(msg));
        this.link_manager.start();
        this.link_manager.on( "msg", this.manage_request.bind(this));

        this.command_handled = {};
        this.response_handlers = [];

        this.managment_handlers = {
            module_config: this.commands_management.bind(this),
            response_config: this.response_management.bind(this)
        };
    }

    private commands_management(new_config: MessagePayload): void
    {
        if (!new_config.commands_handled || !new_config.module_queue) {return;}

        for (const cmd of new_config.commands_handled)
        {
            this.command_handled[cmd] = new_config.module_queue;
        }

        coreLogger.info( "New command_handled: " + JSON.stringify(this.command_handled));
    }

    private response_management(new_conf: MessagePayload): void
    {
        if (!new_conf.module_queue) {return;}
        this.response_handlers.push(new_conf.module_queue);
        coreLogger.info( "New response_handlers: " + JSON.stringify(this.response_handlers));
    }

    private send_response(j_msg: MessagePayload): void
    {
        for (const resp_manager of this.response_handlers)
        {
            coreLogger.info( "Sending response to " + resp_manager);
            this.link_manager.toModule( resp_manager, JSON.stringify(j_msg));
        }
    }

    private manage_request(message: string): void
    {
        coreLogger.debug("Message received: " + message);

        let j_msg: MessagePayload;

        try
        {
            j_msg = JSON.parse(message);
        }
        catch (err)
        {
            coreLogger.error("Invalid JSON message");
            return;
        }

        if (!j_msg.command)
        {
            coreLogger.info("Wrong message");
            return;
        }

        const req_cmd = j_msg.command.trim();

        if (j_msg.error)
        {
            coreLogger.error( `Command <${req_cmd}> has failed: ${j_msg.error}`);
            j_msg.payload = "ERROR: " + j_msg.error;
            j_msg.error = 500;
            this.send_response(j_msg);
            return;
        }

        if (j_msg.type === "request")
        {
            if (this.command_handled.hasOwnProperty(req_cmd))
            {
                const queue = this.command_handled[req_cmd];
                this.link_manager.toModule(queue, message);
                return;
            }

            if (req_cmd === "list_commands")
            {
                this.send_response({ payload: Object.keys(this.command_handled) });
                return;
            }
        }
        else if (j_msg.type === "managment")
        {
            if (this.managment_handlers.hasOwnProperty(req_cmd))
            {
                this.managment_handlers[req_cmd](j_msg);
                return;
            }
        }
        else if (j_msg.type === "response")
        {
            this.send_response(j_msg);
            return;
        }

        coreLogger.error(`Command <${req_cmd}> not implemented`);

        j_msg.payload = `ERROR: Command <${req_cmd}> not implemented`;
        j_msg.error = 500;

        this.send_response(j_msg);
    }
}