# Guiver — Agent Guide

## 🚨 IRON RULE: No commit/push without confirmation

**Never create, execute, or push any commit unless the user explicitly says "ok", "confirm", "go ahead", or equivalent.**
- I may only stage changes and show the diff.
- I must wait for the user's verbal go-ahead before any `git commit` or `git push`.
- This rule is binding in every context, including bug fixes, refactoring, and closing issues.

---

## Project

Central hub for home automation. Born to coordinate software modules that control physical devices (RGB LEDs, relays, water pumps, temperature sensors) and expandable with external modules via WebSocket. Interfaces with ESP8266/ESP32 units around the house via HTTP, with future plans for MQTT.

---

## Project Analysis

### 🚨 Critical issues (blocking)

| # | Issue | File | Detail |
|---|-------|------|--------|
| 1 | **`.env` missing** | root | File doesn't exist. App crashes on startup if `RABBITMQ_IP` is not defined. At least a `.env.example` is needed. |
| 2 | **`to_core()` snake_case doesn't exist** | `components/modules/tasks/loop_task.js:29` | Calls `this.link_manager.to_core("core_queue", ...)` but `LinkManager` (TS) only defines `toCore()` in camelCase. **RUNTIME CRASH** guaranteed. |
| 3 | **`to_core()` in homekit** | `interfaces/homekit.js` | Same issue: calls `to_core()` instead of `toCore()`. Even if blacklisted, will crash as soon as reactivated. |
| 4 | **`to_core()` in ext_modules_manager** | `interfaces/ext_modules_manager.js` | Same issue. Only doesn't crash if never called, but as soon as a message arrives it errors out. |
| 5 | **`ext_modules_manager` doesn't register `response_config`** | `interfaces/ext_modules_manager.js` | Doesn't implement `_start()` to register as response handler. External modules will NEVER receive responses from core. |
| 6 | **`loop_task` mutates received message** | `components/modules/tasks/loop_task.js:28` | `delete command["delta_time"]` directly modifies the parsed JSON object. Dangerous side-effect. |

### ⚠️ Deficiencies (serious but non-blocking)

| # | Deficiency | File | Detail |
|---|-----------|------|--------|
| 1 | **No linter/formatter/typecheck** | `package.json` | `strict: true` in tsconfig but no `tsc` build step. Type errors are never discovered. |
| 2 | **Relay module ignores `light_pin` config** | `components/modules/commands/relay_module.js` | `modules_config.json` passes `light_pin: 3` but the code uses hardcoded `const RELAY_PIN = 2`. |
| 3 | **API `/help` documented but not implemented** | `interfaces/api/routes/` + `restApi.md` | `restApi.md` lists `/help` as endpoint, but no route, controller, or module handles it. |
| 4 | **`wether_test.js` wrong import path** | `tests/wether_test.js` | `require("../modules/wether_modules")` doesn't exist. Should be `../components/modules/commands/weather_module`. |
| 5 | **HomeKit log label wrong** | `interfaces/homekit.js:14` | Uses `"WSS_CLIENTS"` as logger label instead of `"HOMEKIT"` (copy-paste). |
| 6 | ~~**`CRYPTO_API_KEY` not documented**~~ | ~~`components/modules/commands/crypto_module.js`~~ | **RESOLVED**: API key no longer needed, migrated to CoinCap.io. |
| 7 | **No `.env.example`** | root | Anyone forking/cloning the project doesn't know which env vars are needed (missing `INFO_PORT`, `CRYPTO_API_KEY`). |
| 8 | **`package-lock.json` in `.gitignore`** | `.gitignore:4` | Prevents reproducible installs. Should be committed. |
| 9 | ~~**`info_point` loaded as module but does NOT extend Module**~~ | ~~`conf/modules_config.json`~~ + ~~`components/info_point/info_point.js`~~ | **RESOLVED**: Removed from `modules_config.json`, loaded separately in `index.ts` as standalone service. |
| 10 | **Temp station: filename and module name diverge** | `temp_station_module.js` vs `ROOM_TEMP_MODULE` | File is called `temp_station` but registers as `ROOM_TEMP_MODULE` on `room_temp_queue`. Confusing. |
| 11 | **Swagger and code diverge on `relay` type** | `docs/schemas/relay.yaml` vs `relay_module.js` | Swagger says `integer`, the module expects a string (`"light"`). |
| 12 | **`opencode.json` contains hardcoded GitHub PAT** | `opencode.json:10` | Personal access token exposed in the repository. |
| 13 | ~~**Crypto module uses external freecryptoapi.com**~~ | ~~`components/modules/commands/crypto_module.js`~~ | **RESOLVED**: Migrated to CoinCap.io (free, no API key, reliable). |

### 🔮 Future Implementations

| # | Feature | Description |
|---|---------|-------------|
| 1 | **MQTT Broker/Client** | Replace/supplement direct HTTP calls to ESPs with MQTT (standard IoT protocol). Each ESP subscribes to MQTT topics and publishes sensor data. |
| 2 | **Automatic ESP discovery (mDNS/Bonjour)** | Instead of fixed IPs in config, ESPs announce themselves on the network via mDNS (`esp-led.local`, `esp-pompa.local`). |
| 3 | **Web UI** | React/Vue dashboard to control lights, relays, view temperatures and weather without manual API calls. |
| 4 | **Automation/rules engine** | Rule engine like "if temperature > 30°C → turn on fan relay" or "if sunset → turn on LEDs". Integrated with delay/loop module. |
| 5 | **Persistence/DB** | SQLite or InfluxDB to store temperature history, relay states, power consumption. |
| 6 | **Centralized logging** | Replace local log files with a log queue on RabbitMQ and a visualization panel (e.g., Grafana Loki). |
| 7 | **Automated tests** | Unit and integration test suite (Jest/Vitest) for core, modules, and interfaces. Mock RabbitMQ. |
| 8 | **Unified ESP gateway** | Instead of separate modules for LED, relay, pump, a generic ESP module exposing a configurable list of pins/actuators/sensors. |
| 9 | **Security / Authentication** | JWT or API key for REST calls. Isolation between internal and external modules. |
| 10 | **Config hot-reload** | Reload `modules_config.json` and `interfaces_config.json` without restarting the process. |
| 11 | **HomeKit no longer blacklisted** | Restore HomeKit interface after updating it (fix `toCore()`, logger label, configurable ports). |
| 12 | **OTA support for ESP** | ESP firmware updates over the network directly from Guiver. |
| 13 | **Containerization (Docker)** | Dockerfile + docker-compose with RabbitMQ, Guiver, and volumes for persistence. |
| 14 | **Full TypeScript** | Convert all `.js` to `.ts` for type safety across the entire codebase. |

## Run

```bash
npm start          # npx tsx index.ts — launches core, loads modules + interfaces
```

`npm test` is a stub. Tests in `tests/` are manual WebSocket utility scripts (`wsserver_test.js`), not auto-runnable.

## Architecture

- **TypeScript + JavaScript mixed** — `.ts` files use ESM `import`, `.js` modules use `require`. The base `Module` class is TS but JS modules import it via `require("../module").default`.
- **Config-driven boot** — `index.ts` loads `conf/modules_config.json` and `conf/interfaces_config.json`, instantiates every entry dynamically. `info_point` (UDP discovery) is loaded separately as a standalone service, not as a module.
- **Message bus** — RabbitMQ (`amqplib/callback_api`). Each component has its own queue (declared in `LinkManager` constructor). `Core` routes requests from interfaces to modules and responses back.
- **Standard internal message format:**
  ```json
  { "type": "request"|"response"|"managment", "command": "...", "payload": {} }
  ```
- **`Core`** (`components/core/core.ts`) — central router. Holds a `command_handled` map (command → queue) populated by module registration.
- **Modules** (`components/modules/*.js`) — extend `Module` from `components/modules/module.ts`. Call `setHandledCmds()` in constructor. Use `sendResponse`/`sendRequest`/`sendError` helpers.
- **Interfaces** — REST API (`interfaces/api/api_server.ts` + Express routes), WebSocket for external clients (`interfaces/client_manager.ts`), WebSocket for external modules (`interfaces/ext_modules_manager.js`).
- **`homekit_server` is blacklisted** in `index.ts:26` — its interface config exists but is skipped at boot.

## Adding a module

1. Create file under `components/modules/commands/<name>_module.js`
2. Extend `Module` (`require("../module").default`)
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

- **`.env` required** — needs `WSS_CLI_PORT`, `WSS_MDL_PORT`, `API_PORT`, `WEATHER_KEY`, `RABBITMQ_IP`, `RABBITMQ_USR`, `RABBITMQ_PSW`. No `.env.example` exists.
- **RabbitMQ required** at runtime — `LinkManager` connects on start, will throw if unavailable.
- **`pigpio`** is Raspberry Pi only — modules catch the import error and run in mock mode (logged). Safe to develop without RPi hardware.
- **No linter, formatter, or typecheck** scripts in `package.json`. `tsconfig.json` has `strict: true` but no `tsc` build step — `tsx` runs TS directly.
- **Swagger** auto-bundled from `docs/swagger.yaml`, served at `/docs`.
- **Dependabot** configured for weekly npm updates (`.github/dependabot.yml`).
