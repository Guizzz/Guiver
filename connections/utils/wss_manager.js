http = require('http');
WebSocketServer = require('websocket').server;
var EventEmitter = require('events');

class Wss_manager extends EventEmitter
{   
    constructor(wss_port, event_name)
    {   
        super();
        this.event_name = event_name;
        this.server = http.createServer(function(request, response) {});
        this.server.listen(wss_port, function() { });
        console.log("Wss Manager inizializated on port",wss_port,"...");
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
        console.log("Wss Manager started...");
    }

    _handle_request(request)
    {   
        var conn = request.accept(null, request.origin);
        
        console.log("New connection established: ", conn.socket._peername);
        var con_key = conn.socket._peername.address + "_" + conn.socket._peername.port.toString();
        this.established_conn[con_key] = conn;
        console.log("Current connections",  Object.keys(this.established_conn))
        console.log("Current VERIFIED connections",  this.verified_conn)

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
            console.log("Current VERIFIED connections",  this.verified_conn)

            // console.log(message.utf8Data)
            this.emit(this.event_name, message.utf8Data);
        }.bind(this));
        
        conn.on('close', function(conn_, res) {
            // Metodo eseguito alla chiusura della connessione
            var con_key = conn.socket._peername.address + "_" + conn.socket._peername.port.toString();
            console.log("connection closed, client_ID:", conn.socket._peername);
            delete this.established_conn[con_key];

            for (var elem in this.verified_conn)
            {
                if (this.verified_conn[elem] == con_key)
                {
                    delete this.verified_conn[elem];
                    console.log("Current VERIFIED connections",  this.verified_conn)
                    console.log("Current connections",  Object.keys(this.established_conn))
                    return;
                }
            }
            
        }.bind(this));
        
    }

    send_response(data)
    {   
        // console.log("wss send resp",data)
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
            console.log("Corrupted json messagge")
            connets = this.established_conn;
        }
        
        for (var conn in connets)
        {
            connets[conn].sendUTF(data);
        }   
    }
}
module.exports = Wss_manager