http = require('http');
WebSocketServer = require('websocket').server;
var EventEmitter = require('events');
const { interfaceLogger } = require('../utils/logger');


class Wss_manager extends EventEmitter
{   
    constructor(wss_port, event_name, logger = console.log)
    {   
        super();
        this.logger = logger
        this.event_name = event_name;
        this.server = http.createServer(function(request, response) {});
        this.server.listen(wss_port, function() { });
        this.logger("[Wss Manager] inizializated on port " + wss_port + "...");
        this.established_conn = {};
        this.verified_conn = {};
    }
    
    start()
    {   
        this.wsServer = new WebSocketServer({
            httpServer: this.server
        });
        // Gestione degli eventi
        this.wsServer.on('request', this._handle_request.bind(this));
        this.logger("[Wss Manager] started...");
    }

    _handle_request(request)
    {   
        var conn = request.accept(null, request.origin);
        
        this.logger("New connection established: " + conn.socket._peername);
        var con_key = conn.socket._peername.address + "_" + conn.socket._peername.port.toString();
        this.established_conn[con_key] = conn;
        this.logger("Current connections" + Object.keys(this.established_conn).toString())
        this.logger("Current VERIFIED connections" +  this.verified_conn)

        conn.on('message', function(message)
        {
            var msg = JSON.parse(message.utf8Data);
            var con_key = conn.socket._peername.address + "_" + conn.socket._peername.port.toString();
            if(!msg.hasOwnProperty("client_id"))
            {
                var err_Resp = {
                    "error": "Client_id missing"
                }
                conn.sendUTF(JSON.stringify(err_Resp));
                return;
            }
            this.verified_conn[msg.client_id.toString()] = con_key;
            this.logger("Current VERIFIED connections "+ this.verified_conn)

            // this.logger(message.utf8Data)
            this.emit(this.event_name, message.utf8Data);
        }.bind(this));
        
        conn.on('close', function(conn_, res) {
            // Metodo eseguito alla chiusura della connessione
            var con_key = conn.socket._peername.address + "_" + conn.socket._peername.port.toString();
            this.logger("connection closed, client_ID: " + conn.socket._peername);
            delete this.established_conn[con_key];

            for (var elem in this.verified_conn)
            {
                if (this.verified_conn[elem] == con_key)
                {
                    delete this.verified_conn[elem];
                    this.logger("Current VERIFIED connections " +this.verified_conn)
                    this.logger("Current connections " +  Object.keys(this.established_conn))
                    return;
                }
            }
            
        }.bind(this));
        
    }

    send_response(data)
    {   
        // this.logger("wss send resp",data)
        var connets = []
        try{
            if (JSON.parse(data).hasOwnProperty("client_id"))
            {
                var client_id = JSON.parse(data).client_id;
                var con_key = this.verified_conn[client_id.toString()]
                connets.push(this.established_conn[con_key]);
            }
            else
            {
                connets = this.established_conn;
            }
        }
        catch
        {   
            this.logger("Corrupted json messagge")
            connets = this.established_conn;
        }
        
        for (var conn in connets)
        {
            connets[conn].sendUTF(data);
        }   
    }
}
module.exports = Wss_manager