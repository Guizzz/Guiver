# Guiver — Agent Guide

## 🚨 IRON RULE: No commit/push without confirmation

**Never create, execute, or push any commit unless the user explicitly says "ok", "confirm", "go ahead", or equivalent.**
- I may only stage changes and show the diff.
- I must wait for the user's verbal go-ahead before any `git commit` or `git push`.
- This rule is binding in every context, including bug fixes, refactoring, and closing issues.

---

## Project

Central hub for home automation. Born to coordinate software modules that control physical devices (RGB LEDs, relays, water pumps, temperature sensors) and expandable with external modules via WebSocket. Interfaces with ESP8266/ESP32 units around the house via HTTP, with future plans for MQTT.

### 🔮 Future Implementations

| # | Feature | Description |
|---|---------|-------------|
| 1 | **MQTT Bridge** | MQTT bridge (`components/mqtt/mqtt_bridge.ts`) for ESP communication via Mosquitto broker. |
| 2 | **Automatic ESP discovery (mDNS/Bonjour)** | Instead of fixed IPs in config, ESPs announce themselves on the network via mDNS (`esp-led.local`, `esp-pompa.local`). |
| 3 | **Web UI** | React/Vue dashboard to control lights, relays, view temperatures and weather without manual API calls. |
| 4 | **Automation/rules engine** | Rule engine like "if temperature > 30°C → turn on fan relay" or "if sunset → turn on LEDs". Integrated with delay/loop module. |
| 5 | **Persistence/DB** | SQLite or InfluxDB to store temperature history, relay states, power consumption. |
| 6 | **Centralized logging** | Replace local log files with a centralized log service. |
| 7 | **Automated tests** | Unit and integration test suite (Vitest) for core, modules, and interfaces. |
| 8 | **Unified ESP gateway** | Instead of separate modules for LED, relay, pump, a generic ESP module exposing a configurable list of pins/actuators/sensors. |
| 9 | **Security / Authentication** | JWT or API key for REST calls. Isolation between internal and external modules. |
| 10 | **Config hot-reload** | Reload `modules_config.json` and `interfaces_config.json` without restarting the process. |
| 11 | **HomeKit no longer blacklisted** | Restore HomeKit interface (already migrated to EventBus in #30, needs unblacklisting + testing). |
| 12 | **OTA support for ESP** | ESP firmware updates over the network directly from Guiver. |
| 13 | **Containerization (Docker)** | Dockerfile + docker-compose with Guiver and volumes for persistence. |
| 14 | **Full TypeScript** | Convert all `.js` to `.ts` for type safety across the entire codebase. |

## Run

```bash
npm start          # npx tsx index.ts — launches core, loads modules + interfaces
npm run typecheck  # tsc --noEmit
npm run build      # tsc
npm run setup-dev  # scripts/setup-dev.js — one-shot dev environment setup
```

`npm test` uses Vitest (configured, no test files yet). Legacy scripts in `tests/` are manual WebSocket utilities.

## Architecture

- **All TypeScript** — `.ts` files use ESM `import`. The base `Module` class is TS and modules import it.
- **Config-driven boot** — `index.ts` loads `conf/modules_config.json` and `conf/interfaces_config.json`, instantiates every entry dynamically. `info_point` (UDP discovery) is loaded separately as a standalone service, not as a module.
- **EventBus** (`utils/event_bus.ts`) — in-process singleton EventEmitter. No external broker required.
  - `core:request` — interfaces/modules send requests to Core
  - `core:response` — Core broadcasts responses to registered interfaces
  - `core:register` — modules register their command list
  - `core:register_handler` — interfaces register for responses
  - `module:<queue>` — Core routes requests to specific modules
- **Standard internal message format:**
  ```json
  { "type": "request"|"response"|"managment", "command": "...", "payload": {} }
  ```
- **`Core`** (`components/core/core.ts`) — central router. Holds a `command_handled` map (command → module queue) populated by module registration.
- **Modules** (`components/modules/*.ts`) — extend `Module` from `components/modules/module.ts`. Call `setHandledCmds()` in constructor. Use `sendResponse`/`sendRequest`/`sendError` helpers.
- **Interfaces** — REST API (`interfaces/api/api_server.ts` + Express routes), WebSocket for external clients (`interfaces/client_manager.ts`), WebSocket for external modules (`interfaces/ext_modules_manager.ts`).
- **`homekit_server` is blacklisted** in `index.ts:26` — its interface config exists but is skipped at boot (migrated to EventBus, ready to re-enable after testing).

## Adding a module

1. Create file under `components/modules/commands/<name>_module.ts`
2. Extend `Module`
3. `super("NAME", "name_queue", config)` and `setHandledCmds({ ... })`
4. Add entry to `conf/modules_config.json`

## Planning style preference

When organizing work, I must always:
- Cross-reference every item with corresponding GitHub issues (mapping table)
- Order by priority/dependencies (P0 security/blocking → P1 bugs → refactoring)
- Use ASCII diagrams to show dependencies between phases
- Include estimated time for each task
- Ask for confirmation before executing

## Important constraints

- **`.env` required** — needs `WSS_CLI_PORT`, `WSS_MDL_PORT`, `API_PORT`, `INFO_PORT`, `WEATHER_KEY`. See `.env.example`.
- **No external broker** required at runtime — EventBus handles all internal communication.
- **`pigpio`** is Raspberry Pi only — modules catch the import error and run in mock mode (logged). Safe to develop without RPi hardware.
- **No linter or formatter** scripts in `package.json`. `tsconfig.json` has `strict: true`.
- **Swagger** auto-bundled from `docs/swagger.yaml`, served at `/docs`.
- **Dependabot** configured for weekly npm updates (`.github/dependabot.yml`).
