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
            console.log("Received:", JSON.parse(message.utf8Data));
        }
    });

    var stdin = process.openStdin();
    stdin.on('data', run.bind(this)); 

    function sendNumber(data) {
        if (connection.connected) {
            msg = {}
            msg["client_id"]= ID;
            msg["command"] = data.toString()
            // console.log(data);
            connection.sendUTF(JSON.stringify(msg));
        }
    }

    var redValue=0;
    var greenValue=0;
    var blueValue=0;

    // setInterval(run.bind(this), 1000)

    function run(num){
        num = parseInt(num);
        console.log(num);
        if(!num)
            num=5
        data = {
            "type": "request", 
            "command": "led_manual",
            "payload" :{
                "redValue": redValue,
                "greenValue": greenValue,
                "blueValue": blueValue,
            }
        };
        
        redValue = (redValue + num) % 255;
        greenValue = (greenValue + num) % 255;
        blueValue = (blueValue + num) % 255;

        // data["client_id"]= ID;
        // console.log(data);
        connection.sendUTF(JSON.stringify(data));

    }
});

client.connect('ws://192.168.1.22:7777/');