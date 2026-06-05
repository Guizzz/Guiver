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

### ⚠️ Deficiencies (serious but non-blocking)

| # | Deficiency | File | Detail |
|---|-----------|------|--------|
| 1 | **No linter/formatter/typecheck** | `package.json` | `strict: true` in tsconfig but no `tsc` build step. Type errors are never discovered. |
| 2 | **Relay module ignores `light_pin` config** | `components/modules/commands/relay_module.js` | `modules_config.json` passes `light_pin: 3` but the code uses hardcoded `const RELAY_PIN = 2`. |
| 3 | **API `/help` documented but not implemented** | `interfaces/api/routes/` + `restApi.md` | `restApi.md` lists `/help` as endpoint, but no route, controller, or module handles it. |
| 4 | **`wether_test.js` wrong import path** | `tests/wether_test.js` | `require("../modules/wether_modules")` doesn't exist. Should be `../components/modules/commands/weather_module`. |
| 5 | **HomeKit log label wrong** | `interfaces/homekit.js:14` | Uses `"WSS_CLIENTS"` as logger label instead of `"HOMEKIT"` (copy-paste). |
| 6 | ~~**`CRYPTO_API_KEY` not documented**~~ | ~~`components/modules/commands/crypto_module.js`~~ | **RESOLVED**: API key no longer needed, migrated to CoinCap.io. |
| 7 | **No `.env.example`** | root | Anyone forking/cloning the project doesn't know which env vars are needed (missing `INFO_PORT`). |
| 8 | **`package-lock.json` in `.gitignore`** | `.gitignore:4` | Prevents reproducible installs. Should be committed. |
| 9 | ~~**`info_point` loaded as module but does NOT extend Module**~~ | ~~`conf/modules_config.json`~~ + ~~`components/info_point/info_point.js`~~ | **RESOLVED**: Removed from `modules_config.json`, loaded separately in `index.ts` as standalone service. |
| 10 | **Temp station: filename and module name diverge** | `temp_station_module.js` vs `ROOM_TEMP_MODULE` | File is called `temp_station` but registers as `ROOM_TEMP_MODULE` on `room_temp_queue`. Confusing. |
| 11 | **Swagger and code diverge on `relay` type** | `docs/schemas/relay.yaml` vs `relay_module.js` | Swagger says `integer`, the module expects a string (`"light"`). |
| 12 | **`opencode.json` contains hardcoded GitHub PAT** | `opencode.json:10` | Personal access token exposed in the repository. |
| 13 | ~~**Crypto module uses external freecryptoapi.com**~~ | ~~`components/modules/commands/crypto_module.js`~~ | **RESOLVED**: Migrated to CoinCap.io (free, no API key, reliable). |

### Resolved critical issues

The following blocking issues from the original analysis have been resolved:

| # | Issue | Resolution |
|---|-------|------------|
| 2 | **`to_core()` snake_case in loop_task** | Migrated to TypeScript + EventBus (`#15`, `#24-#27`) |
| 3 | **`to_core()` in homekit** | Migrated to EventBus (`#27`/`#30`) |
| 4 | **`to_core()` in ext_modules_manager** | Migrated to EventBus (`#27`) |
| 5 | **`ext_modules_manager` doesn't register `response_config`** | Fixed in `#15` (TS migration + EventBus) |
| 6 | **`loop_task` mutates received message** | Fixed in `#15` (TS migration) |

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
