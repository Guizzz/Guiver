# Guiver 🚀

Central hub for home automation. Coordinates software modules that control physical devices (RGB LEDs, relays, water pumps, temperature sensors) and expandable with external modules via WebSocket. Interfaces with ESP8266/ESP32 units around the house via HTTP, with future plans for MQTT.

## Architecture

- **EventBus** (`utils/event_bus.ts`) — in-process EventEmitter singleton for all internal communication (Core ↔ Modules ↔ Interfaces). No external broker required.
- **Config-driven boot** — `index.ts` loads `conf/modules_config.json` and `conf/interfaces_config.json`, instantiating every entry dynamically. `info_point` (UDP discovery) is loaded separately as a standalone service.
- **Core** (`components/core/core.ts`) — central router. Holds a `command_handled` map (command → module queue) populated by module registration.
- **Modules** extend `Module` from `components/modules/module.ts`. Call `setHandledCmds()` in constructor. Use `sendResponse`/`sendRequest`/`sendError` helpers.
- **Interfaces** — REST API (`interfaces/api/api_server.ts` + Express routes), WebSocket for external clients (`interfaces/client_manager.ts`), WebSocket for external modules (`interfaces/ext_modules_manager.ts`).
- **MQTT** (optional) — `components/mqtt/mqtt_bridge.ts` connects to an external Mosquitto broker for ESP communication.

### Standard internal message format

```json
{ "type": "request"|"response"|"managment", "command": "...", "payload": {} }
```

## Quick start

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in the values:
   ```plaintext
   WSS_CLI_PORT=8081
   WSS_MDL_PORT=8082
   API_PORT=8080
   INFO_PORT=54321
   WEATHER_KEY=your_openweathermap_api_key
   ```
3. Run `npm install` to install dependencies.
4. Run `npm start` to launch the server.

> **One-shot dev setup:** `npm run setup-dev` installs Mosquitto (if missing), creates `.env`, installs dependencies, and runs TypeScript typecheck.

## Deploy to Raspberry Pi

Guiver runs as a `systemd` service on a Raspberry Pi.

```bash
npm run ssh-setup   # configure passwordless SSH access
npm run setup       # clone repo, install deps, configure systemd + Mosquitto
npm run deploy      # pull latest main, npm install, restart service
npm run cleanup     # fix ownership, clean untracked files, reinstall deps
```

After initial setup, the service auto-starts on boot. Logs: `journalctl -u guiver -f`.

## Scripts reference

| Script | Description |
|--------|-------------|
| `npm run setup-dev` | One-shot local dev environment setup: installs Mosquitto (Win/Mac/Linux), creates `.env` from `.env.example`, runs `npm install`, validates TypeScript. |
| `npm run ssh-setup` | Generates an SSH key if missing and copies it to the Raspberry Pi for passwordless access. |
| `npm run setup` | Full Raspberry Pi provisioning: clones repo, installs npm deps, installs `systemd` service, installs + configures Mosquitto MQTT broker. |
| `npm run deploy` | SSHes into the Pi, `git pull`s latest `main`, runs `npm install`, restarts the `guiver` service. |
| `npm run cleanup` | SSHes into the Pi, fixes file ownership, removes untracked files, reinstalls `node_modules` from scratch, restarts the service. |
| `npm run typecheck` | `tsc --noEmit` — validates TypeScript without emitting output. |
| `npm run build` | `tsc` — compiles TypeScript to JavaScript. |

### Configurable environment variables for deploy scripts

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `192.168.1.109` | IP of the Raspberry Pi |
| `USER` | `guizz` | SSH user on the Pi |
| `PATH` | `/home/guizz/progetti/Guiver` | Remote directory on the Pi |

## Adding a module

1. Create file under `components/modules/commands/<name>_module.ts`.
2. Extend `Module` with `super("NAME", "name_queue", config)` and call `setHandledCmds({ ... })`.
3. Add entry to `conf/modules_config.json`.

## Constraints

- **No external broker** required at runtime — EventBus handles all internal communication.
- **`pigpio`** is Raspberry Pi only — modules catch the import error and run in mock mode (logged). Safe to develop without RPi hardware.
- **Swagger** auto-bundled from `docs/swagger.yaml`, served at `/docs`.
- **`.env` required** — needs the values shown in Quick start above.

## License

MIT — see [LICENSE](LICENSE).
