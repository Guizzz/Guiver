
import { EventEmitter } from "events";
import * as amqp from "amqplib/callback_api";

export default class LinkManager extends EventEmitter {
    private caller: string;
    private queueIn: string;
    private logger: (...args: any[]) => void;
    private channel: any;

    constructor( name: string, queueIn: string, logger: (...args: any[]) => void = console.log ) 
    {
        super();

        this.caller = name;
        this.queueIn = queueIn;
        this.logger = logger;

        this.logger("[LINK] Link Manager initialized...");
    }

    public start(): void 
{
        this.logger("[LINK] Link Manager started...");
        const rabbitServerIp = process.env.RABBITMQ_IP?.toString();

        if (!rabbitServerIp) { throw new Error("RABBITMQ_IP is not defined"); }

        const opt = {
            credentials: require("amqplib").credentials.plain(
                process.env.RABBITMQ_USR,
                process.env.RABBITMQ_PSW
            )
        };

        amqp.connect(
            `amqp://${rabbitServerIp}`,
            opt,
            this._rabbitHandler.bind(this)
        );
    }

    public toCore(queueOut: string, data: string): void {
        this.channel.sendToQueue(queueOut, Buffer.from(data));
    }

    public toModule(queueOut: string, data: string): void {
        this.channel.sendToQueue(queueOut, Buffer.from(data));
    }

    public fromCore(data: string): void {
        this.emit("msg", data.trim());
    }

    private _rabbitHandler( error0: Error | null, connection: amqp.Connection ): void 
    {
        this.logger("[LINK] connected");
        if (error0) { throw error0; }

        connection.createChannel(
            (error1: Error | null, c: amqp.Channel) => {
                if (error1) {
                    throw error1;
                }

                this.channel = c;

                this.emit("channel_new");

                this.channel.assertQueue(this.queueIn, {
                    durable: false
                });

                this.channel.consume(
                    this.queueIn,
                    (msg: amqp.Message | null) => {
                        if (!msg) {
                            return;
                        }

                        this.fromCore(msg.content.toString());
                    },
                    {
                        noAck: true
                    }
                );
            }
        );
    }
}
