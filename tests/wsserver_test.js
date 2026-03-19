const WebSocketClient = require("websocket").client;
const readline = require("readline");

const client = new WebSocketClient();
const CLIENT_ID = Math.floor(Math.random() * 0xffffff);

let connection = null;

client.on("connectFailed", (error) => {
  console.error("Connect Error:", error.message);
});

client.on("connect", (conn) => {
  console.log("✅ WebSocket Connected");
  connection = conn;

  conn.on("error", (error) => {
    console.error("Connection Error:", error.message);
  });

  conn.on("close", () => {
    console.log("❌ Connection Closed");
    process.exit();
  });

  conn.on("message", (message) => {
    if (message.type === "utf8") {
      try {
        console.log("📩", JSON.parse(message.utf8Data));
      } catch {
        console.log("📩 RAW:", message.utf8Data);
      }
    }
  });

  startCLI();
});

client.connect("ws://127.0.0.1:7777/");


// ================= CLI =================

function startCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", (line) => {
    const input = line.trim();
    handleCommand(input);
    rl.prompt();
  });
}


// ================= COMMAND HANDLER =================

function send(command, payload = {}) {
  if (!connection) return console.error("No connection");

  const msg = {
    type: "request",
    command,
    client_id: CLIENT_ID,
    payload,
  };

  console.log("📤", msg);
  connection.sendUTF(JSON.stringify(msg));
}

function handleCommand(input) {
  const [cmd, arg] = input.split(" ");

  switch (cmd) {
    case "on":
      send("delay", {
        delay_time: 5000,
        command_to_delay: "rainbow_start",
        payload_to_dealy: { time: 30, brightnes: 200 },
      });
      break;

    case "loop":
      send("add_loop_task", {
        delta_time: 5000,
        command_to_loop: "get_weather",
      });
      break;

    case "unloop":
      send("delete_loop_task", {
        command_to_unloop: "get_weather",
      });
      break;

    case "w":
      send("get_weather", { city: arg || "latina" });
      break;

    case "s":
      send("led_status");
      break;

    case "r":
      send("relay_status");
      break;
    
    case "i":
      send("list_commands");
      break;

    case "p":
      send("get_water_pump_status");
      break;

    case "color":
      runColorCycle(parseInt(arg) || 5);
      break;

    default:
      console.log("Unknown command");
  }
}


// ================= COLOR TEST =================

let red = 0;
let green = 0;
let blue = 0;

function runColorCycle(step = 5) {
  const data = {
    redValue: red,
    greenValue: green,
    blueValue: blue,
  };

  send("led_manual", data);

  red = (red + step) % 255;
  green = (green + step) % 255;
  blue = (blue + step) % 255;
}