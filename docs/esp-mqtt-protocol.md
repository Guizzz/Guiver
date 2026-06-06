# ESP ↔ Guiver — MQTT Protocol

## Overview

Guiver communicates with ESP devices over MQTT via a local Mosquitto broker.
Each ESP is identified by a unique `device_id` (chosen at firmware compile time).
Adding a new ESP requires only a new firmware with a different `device_id` — no
Guiver code or configuration changes.

---

## Broker

| Setting     | Value                     |
|-------------|---------------------------|
| Host        | `192.168.1.109`           |
| Port        | `1883`                    |
| Protocol    | MQTT v3.1.1 / v5         |
| Transport   | TCP (no TLS on LAN)       |

**ESP connection parameters:**

| Parameter      | Value          |
|----------------|----------------|
| Client ID      | `<device_id>`  |
| Keepalive      | `60` seconds   |
| Clean Session  | `true`         |

---

## Topic Convention

All topics use the `guiver/` prefix and UTF-8 string payloads (JSON).

| Topic                              | Direction      | Retained | QoS | Description                              |
|------------------------------------|----------------|----------|-----|------------------------------------------|
| `guiver/<id>/announce`             | ESP → Broker   | ✅ Yes   | 1   | Device birth certificate at boot         |
| `guiver/<id>/online`               | ESP → Broker   | ✅ Yes   | 1   | Online heartbeat (`1`/`0` via LWT)       |
| `guiver/<id>/status`               | ESP → Broker   | ❌ No    | 0   | Periodic sensor / state data             |
| `guiver/<id>/command`              | Broker → ESP   | ❌ No    | 1   | Commands from Guiver                     |
| `guiver/<id>/response`             | ESP → Broker   | ❌ No    | 1   | Response to a command                    |

### Topic Details

#### `guiver/<id>/announce`

Published **once** at boot (retained). Describes the device capabilities.

```json
{
  "type": "temperature",
  "name": "Serra",
  "sensors": ["temperature", "humidity"],
  "interval": 30
}
```

| Field     | Type            | Required | Description                                          |
|-----------|-----------------|----------|------------------------------------------------------|
| `type`    | `string`        | ✅       | Device category (see below)                          |
| `name`    | `string`        | ✅       | Human-readable label                                 |
| `sensors` | `string[]`      | ❌       | List of sensor names this device publishes           |
| `actuators` | `{name, label}[]` | ❌    | List of actuator channels (relays, pumps, etc.)      |
| `interval` | `number`       | ❌       | Status publish interval in seconds (default `60`)    |

**Supported device types:**

| Type          | Sensors (example)                | Actuators (example)          | Read/Write |
|---------------|----------------------------------|------------------------------|------------|
| `temperature` | `temperature`, `humidity`        | —                            | Read-only  |
| `relay`       | —                                | `relay1`, `relay2`           | Read/write |
| `pump`        | —                                | `pump`                       | Read/write |

#### `guiver/<id>/online`

Retained message with LWT. Used for fast offline detection.

| Payload | Meaning |
|---------|---------|
| `1`     | Device is online (published by ESP at boot) |
| `0`     | Device went offline (published automatically via LWT) |

**ESP must configure LWT on connect:**
- Topic: `guiver/<id>/online`
- Payload: `0`
- Retain: `true`
- QoS: `1`

#### `guiver/<id>/status`

Periodic data pushed by the ESP. Frequency defined by `interval` in announce.

**Temperature sensor:**
```json
{
  "temperature": 23.5,
  "humidity": 62
}
```

**Relay actuator:**
```json
{
  "relay1": true,
  "relay2": false
}
```

**Pump:**
```json
{
  "running": false
}
```

#### `guiver/<id>/command`

Commands sent from Guiver to the ESP. The ESP must subscribe to this topic.

**Set relay:**
```json
{
  "cmd": "set_relay",
  "value": true
}
```

**Start/stop pump:**
```json
{
  "cmd": "set_pump",
  "value": true
}
```

| Field   | Type              | Required | Description                     |
|---------|-------------------|----------|---------------------------------|
| `cmd`   | `string`          | ✅       | Command name                    |
| `value` | `boolean|number|string` | ✅ | Command parameter               |

#### `guiver/<id>/response`

ESP response to a command. Published once after executing.

```json
{
  "status": "ok",
  "state": {
    "relay1": true
  }
}
```

| Field    | Type     | Required | Description                         |
|----------|----------|----------|-------------------------------------|
| `status` | `string` | ✅       | `"ok"` or `"error"`                 |
| `state`  | `object` | ❌       | Current device state after command  |

---

## Offline Detection

Guiver uses two mechanisms:

| Mechanism   | Latency  | Detects                         |
|-------------|----------|---------------------------------|
| **LWT**     | ~60s     | WiFi drop, power loss, crash    |
| **Timeout** | 3×interval | Frozen / hung but connected  |

If no `status` message arrives within `interval × 3` seconds, Guiver marks the
device as offline regardless of the LWT value.

---

## Example Flows

### Temperature sensor (read-only)

```
ESP (serra)                     Mosquitto                  Guiver
    │                              │                         │
    │── announce ─────────────────→│ (retained)              │
    │── online=1 ─────────────────→│ (retained + LWT)        │
    │                              │                         │
    │── status (every 30s) ───────→│────→ ESP Manager        │
    │                              │     aggiorna registro   │
    │                              │                         │
    │                              │     GET /esp            │
    │                              │     ← { temperature }   │
    │                              │                         │
```

### Relay actuator (read/write)

```
ESP (luci_garden)                Mosquitto                  Guiver
    │                              │                         │
    │── announce ─────────────────→│ (retained)              │
    │── online=1 ─────────────────→│ (retained + LWT)        │
    │── status = { relay1: false } │                         │
    │                              │                         │
    │                              │  POST /esp/luci_garden/command
    │                              │  { cmd: "set_relay", value: true }
    │                              │                         │
    │←─ command ──────────────────│──── ESP Manager publish  │
    │                              │                         │
    │── response { status:"ok" } ─→│──── ESP Manager → API   │
    │                              │                         │
```

---

## Adding a New ESP

1. Write firmware with a unique `device_id` (e.g. `cantina`, `giardino`, `stanza`)
2. Follow the topic convention and JSON payloads
3. Include all required topics: `announce`, `online` (with LWT), `status`
4. If the device has actuators, subscribe to `guiver/<id>/command` and publish responses on `guiver/<id>/response`
5. Flash the ESP and power it on
6. Guiver discovers it automatically via `guiver/+/announce`

**No Guiver code or configuration changes required.**

---

## API Endpoints (reference)

Once discovered, ESP data is accessible via:

| Method | Endpoint                     | Description                        |
|--------|------------------------------|------------------------------------|
| GET    | `/esp`                       | List all devices                   |
| GET    | `/esp/temperature`           | Filter by type                     |
| POST   | `/esp/<id>/command`          | Send command to a specific device  |
