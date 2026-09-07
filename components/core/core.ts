import fs from "fs";
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
    private secured_commands: Record<string, string[]>;

    constructor()
    {
        this.command_handled = {};
        this.response_handlers = [];

        this.secured_commands = this.loadSecurityConfig();

        this.managment_handlers = {
            module_config: this.commands_management.bind(this),
            response_config: this.response_management.bind(this)
        };

        EventBus.subscribe("core:request", this.manage_request.bind(this));
        EventBus.subscribe("core:register", this.commands_management.bind(this));
        EventBus.subscribe("core:register_handler", this.response_management.bind(this));
    }

    private loadSecurityConfig(): Record<string, string[]>
    {
        try
        {
            const raw = JSON.parse(fs.readFileSync("conf/security_config.json", "utf8"));
            const map: Record<string, string[]> = {};

            for (const [cmd, val] of Object.entries(raw))
            {
                map[cmd] = Array.isArray(val) ? val.map(String) : [String(val)];
            }

            return map;
        }
        catch
        {
            return {};
        }
    }

    private isSecured(cmd: string): boolean
    {
        return this.secured_commands.hasOwnProperty(cmd);
    }

    private getPin(j_msg: MessagePayload): string | undefined
    {
        const payload = j_msg.payload;

        if (payload && typeof payload === "object" && payload.pin !== undefined)
        {
            return String(payload.pin);
        }

        if (j_msg.pin !== undefined)
        {
            return String(j_msg.pin);
        }

        return undefined;
    }

    private checkPin(cmd: string, j_msg: MessagePayload): boolean
    {
        const allowed = this.secured_commands[cmd];

        if (!Array.isArray(allowed)) {return false;}

        const pin = this.getPin(j_msg);

        return pin !== undefined && allowed.includes(pin);
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
            if (this.isSecured(req_cmd) && !this.checkPin(req_cmd, j_msg))
            {
                coreLogger.error(`Command <${req_cmd}> requires a valid security code`);
                this.send_response({
                    id: j_msg.id,
                    type: "response",
                    command: req_cmd,
                    error: "Invalid or missing security code",
                    timestamp: Date.now(),
                    ...(j_msg.client_id ? { client_id: j_msg.client_id } : {})
                });
                return;
            }

            if (this.command_handled.hasOwnProperty(req_cmd))
            {
                if (j_msg.payload && typeof j_msg.payload === "object")
                {
                    delete j_msg.payload.pin;
                }

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