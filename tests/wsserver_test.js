var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

var ID = Math.round(Math.random() * 0xFFFFFF);

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });

    var stdin = process.openStdin();
    stdin.on('data', sendNumber.bind(this)); 

    function sendNumber(data) {
        if (connection.connected) {

            data = {
                "client_id": ID,
                "command": data.toString()
            }

            connection.sendUTF(JSON.stringify(data));
            
        }
    }
});

client.connect('ws://localhost:7777/');