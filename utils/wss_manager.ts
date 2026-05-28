import http from "http";
import { server as WebSocketServer, connection, request } from "websocket";
import { EventEmitter } from "events";

class WssManager extends EventEmitter {
    private logger: (...args: any[]) => void;
    private eventName: string;

    private server: http.Server;
    private wsServer!: WebSocketServer;

    private establishedConn: Record<string, connection>;
    private verifiedConn: Record<string, string>;

    constructor(
        wssPort: number | string,
        eventName: string,
        logger: (...args: any[]) => void = console.log
    ) {
        super();

        this.logger = logger;
        this.eventName = eventName;

        this.server = http.createServer(
            (_request, response) => {
                response.writeHead(404);
                response.end();
            }
        );

        this.server.listen(wssPort);

        this.logger(
            `[Wss Manager] initialized on port ${wssPort}...`
        );

        this.establishedConn = {};
        this.verifiedConn = {};
    }

    public start(): void {
        this.wsServer = new WebSocketServer({
            httpServer: this.server
        });

        this.wsServer.on(
            "request",
            this._handleRequest.bind(this)
        );

        this.logger("[Wss Manager] started...");
    }

    private _handleRequest(req: request): void {
        const conn = req.accept(null, req.origin);
        const conKey = conn.socket.remoteAddress + ":" + conn.socket.remotePort;

        this.logger(
            `New connection established: ${conKey}`
        );

        this.establishedConn[conKey] = conn;

        this.logger(
            `Current connections: ${Object.keys(
                this.establishedConn
            ).toString()}`
        );

        conn.on("message", (message) => {
            if (message.type !== "utf8") {
                return;
            }

            try {
                const msg = JSON.parse(message.utf8Data);

                if (!msg.hasOwnProperty("client_id")) {
                    conn.sendUTF(
                        JSON.stringify({
                            error: "Client_id missing"
                        })
                    );

                    return;
                }

                this.verifiedConn[
                    msg.client_id.toString()
                ] = conKey;

                this.logger(
                    `Current VERIFIED connections ${JSON.stringify(
                        this.verifiedConn
                    )}`
                );

                this.emit(
                    this.eventName,
                    message.utf8Data
                );
            } catch {
                this.logger("Invalid JSON message");
            }
        });

        conn.on("close", () => {
            this.logger(
                `Connection closed: ${conKey}`
            );

            delete this.establishedConn[conKey];

            for (const elem in this.verifiedConn) {
                if (
                    this.verifiedConn[elem] === conKey
                ) {
                    delete this.verifiedConn[elem];

                    this.logger(
                        `Current VERIFIED connections ${JSON.stringify(
                            this.verifiedConn
                        )}`
                    );

                    break;
                }
            }

            this.logger(
                `Current connections ${Object.keys(
                    this.establishedConn
                )}`
            );
        });
    }

    public sendResponse(data: string): void {
        let conns: connection[] = [];

        try {
            const parsed = JSON.parse(data);

            if (parsed.hasOwnProperty("client_id")) {
                const clientId =
                    parsed.client_id.toString();

                const conKey =
                    this.verifiedConn[clientId];

                const conn =
                    this.establishedConn[conKey];

                if (conn) {
                    conns.push(conn);
                }
            } else {
                conns = Object.values(
                    this.establishedConn
                );
            }
        } catch {
            this.logger("Corrupted JSON message");

            conns = Object.values(
                this.establishedConn
            );
        }

        for (const conn of conns) {
            conn.sendUTF(data);
        }
    }
}

export default WssManager;