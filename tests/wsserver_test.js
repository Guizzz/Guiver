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

    function sendNumber() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);

            data = {
                "client_id": ID,
                "payload": number.toString(16)
            }

            connection.sendUTF(JSON.stringify(data));
            
        }
    }
    sendNumber();
    setTimeout(sendNumber, 3000);
    setTimeout(sendNumber, 6000);
    setTimeout(()=>{connection.close(1000, ID.toString())}, 7000)
    //connection.close(1000, ID.toString())
});

client.connect('ws://localhost:1337/');