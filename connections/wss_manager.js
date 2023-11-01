http = require('http');
WebSocketServer = require('websocket').server;
const EventEmitter = require('events');

class Wss_manager extends EventEmitter
{   
    constructor()
    {   
        super();
        this.server = http.createServer(function(request, response) {});
        this.server.listen(1337, function() { });
        console.log("Wss Manager inizializated...");
        this.established_conn = {};
        console.log(this.established_conn);
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
        conn.on('message', function(message){
            this.established_conn[JSON.parse(message.utf8Data).client_id.toString()] = conn;
            console.log(message.utf8Data)
            this.emit("msg", message.utf8Data);
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
        var connets = []
        try{
            if (JSON.parse(data).hasOwnProperty("client_id"))
            {
                var client_id = JSON.parse(data).client_id;
                connets.push(this.established_conn[client_id.toString()]);
            }
        }
        catch
        {   
            console.log("Corrupted json messagge or client_id is null")
            connets = this.established_conn;
        }

        for (var conn in connets)
        {
            connets[conn].sendUTF(data);
        }   
    }
}

module.exports = Wss_manager