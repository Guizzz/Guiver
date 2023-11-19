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
        conn.on('message', function(message)
        {
            var msg = JSON.parse(message.utf8Data);
            if(!msg.hasOwnProperty("client_id"))
            {
                conn.sendUTF("FAIL: Client_id missing"); //TODO
                return;
            }
            
            this.established_conn[msg.client_id.toString()] = conn;
            // console.log(message.utf8Data)
            this.emit(this.event_name, message.utf8Data);
        }.bind(this));
        
        conn.on('close', function(conn, res) {
            // Metodo eseguito alla chiusura della connessione
            console.log("connection closed, client_ID:", res);
            delete this.established_conn[res];
            console.log("on_close", Object.keys(this.established_conn))
        }.bind(this));
        
    }

    send_response(data)
    {   
        console.log("wss send resp",data)
        var connets = []
        try{
            if (JSON.parse(data).hasOwnProperty("client_id"))
            {
                var client_id = JSON.parse(data).client_id;
                connets.push(this.established_conn[client_id.toString()]);
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