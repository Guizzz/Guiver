import EventBus from "../../utils/event_bus";
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
    private command_handled: Record<string, string>;
    private response_handlers: string[];
    private managment_handlers: Record<string, ManagementHandler>;

    constructor()
    {
        this.command_handled = {};
        this.response_handlers = [];

        this.managment_handlers = {
            module_config: this.commands_management.bind(this),
            response_config: this.response_management.bind(this)
        };

        EventBus.subscribe("core:request", this.manage_request.bind(this));
        EventBus.subscribe("core:register", this.commands_management.bind(this));
        EventBus.subscribe("core:register_handler", this.response_management.bind(this));
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
        coreLogger.info("Sending response to " + this.response_handlers.join(", "));
        EventBus.publish("core:response", j_msg);
    }

    private manage_request(j_msg: MessagePayload): void
    {
        coreLogger.debug("Message received: " + JSON.stringify(j_msg));

        if (!j_msg || typeof j_msg !== "object")
        {
            coreLogger.error("Invalid message");
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
                EventBus.publish("module:" + queue, j_msg);
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