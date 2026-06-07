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

---

## Firmware Implementation Guide (Arduino / ESP8266 / ESP32)

### Required Libraries

| Library         | Purpose                |
|-----------------|------------------------|
| `PubSubClient`  | MQTT client            |
| `ArduinoJson`   | JSON serialization     |

### Boot Sequence (pseudocodice)

```
setup():
  1. connect WiFi
  2. configure MQTT (server, client ID)
  3. configure LWT  →  guiver/<id>/online  retain  QOS1
  4. connect MQTT
  5. publish announce (retained)  →  guiver/<id>/announce  QOS1
  6. publish online=1 (retained)  →  guiver/<id>/online     QOS1
  7. subscribe command            →  guiver/<id>/command    QOS1

loop():
  - maintain MQTT connection
  - every `interval` seconds: publish status  →  guiver/<id>/status  QOS0
  - handle incoming commands via callback
```

### Template — Device generico

```cpp
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "your_ssid";
const char* WIFI_PASSWORD = "your_password";
const char* MQTT_HOST     = "192.168.1.109";
const int   MQTT_PORT     = 1883;

#define DEVICE_ID  "luci_garden"    // unico per ogni ESP
#define INTERVAL   30               // secondi tra status

WiFiClient wifiClient;
PubSubClient client(wifiClient);

unsigned long lastStatus = 0;

// ── helper publish con JSON ──────────────────────────────────────
void publishJson(const char* topic, JsonDocument& doc, bool retained, int qos) {
  char buffer[256];
  size_t n = serializeJson(doc, buffer);
  client.publish(topic, buffer, retained ? 1 : 0, retained);
}

// ── publish announce (boot) ──────────────────────────────────────
void publishAnnounce() {
  StaticJsonDocument<256> doc;
  doc["type"]      = "relay";
  doc["name"]      = "Luci Garden";

  JsonArray actuators = doc.createNestedArray("actuators");
  JsonObject r1 = actuators.createNestedObject();
  r1["name"]  = "relay1";
  r1["label"] = "Relè 1";

  doc["interval"] = INTERVAL;

  char topic[64];
  snprintf(topic, sizeof(topic), "guiver/%s/announce", DEVICE_ID);
  publishJson(topic, doc, true, 1);
}

// ── publish status (periodico) ───────────────────────────────────
void publishStatus() {
  StaticJsonDocument<128> doc;
  doc["relay1"] = digitalRead(D1);   // true/false

  char topic[64];
  snprintf(topic, sizeof(topic), "guiver/%s/status", DEVICE_ID);
  publishJson(topic, doc, false, 0);
}

// ── publish response (dopo un comando) ───────────────────────────
void publishResponse(const char* status, JsonDocument* state = nullptr) {
  StaticJsonDocument<128> doc;
  doc["status"] = status;
  if (state) doc["state"] = *state;

  char topic[64];
  snprintf(topic, sizeof(topic), "guiver/%s/response", DEVICE_ID);
  publishJson(topic, doc, false, 1);
}

// ── MQTT callback ────────────────────────────────────────────────
void callback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) return;

  const char* cmd = doc["cmd"];

  if (strcmp(cmd, "set_relay") == 0) {
    bool value = doc["value"];
    digitalWrite(D1, value ? HIGH : LOW);

    StaticJsonDocument<64> state;
    state["relay1"] = value;
    publishResponse("ok", &state);
  }
}

// ── reconnect MQTT con LWT ───────────────────────────────────────
void mqttReconnect() {
  char willTopic[64];
  snprintf(willTopic, sizeof(willTopic), "guiver/%s/online", DEVICE_ID);

  if (client.connect(DEVICE_ID, willTopic, 1, true, "0")) {
    publishAnnounce();

    char onlineTopic[64];
    snprintf(onlineTopic, sizeof(onlineTopic), "guiver/%s/online", DEVICE_ID);
    client.publish(onlineTopic, "1", 1, true);

    char cmdTopic[64];
    snprintf(cmdTopic, sizeof(cmdTopic), "guiver/%s/command", DEVICE_ID);
    client.subscribe(cmdTopic, 1);
  }
}

// ── setup ────────────────────────────────────────────────────────
void setup() {
  pinMode(D1, OUTPUT);
  digitalWrite(D1, LOW);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  client.setServer(MQTT_HOST, MQTT_PORT);
  client.setCallback(callback);
}

// ── loop ─────────────────────────────────────────────────────────
void loop() {
  if (!client.connected()) mqttReconnect();
  client.loop();

  if (millis() - lastStatus > INTERVAL * 1000UL) {
    publishStatus();
    lastStatus = millis();
  }
}
```

### Template — Temperature sensor (sola lettura)

Stessa struttura, cambiano `announce` e `status`:

```cpp
void publishAnnounce() {
  StaticJsonDocument<256> doc;
  doc["type"]      = "temperature";
  doc["name"]      = "Serra";

  JsonArray sensors = doc.createNestedArray("sensors");
  sensors.add("temperature");
  sensors.add("humidity");

  doc["interval"] = 30;

  char topic[64];
  snprintf(topic, sizeof(topic), "guiver/%s/announce", DEVICE_ID);
  publishJson(topic, doc, true, 1);
}

void publishStatus() {
  StaticJsonDocument<128> doc;
  doc["temperature"] = 23.5;   // dal sensore
  doc["humidity"]    = 62.0;

  char topic[64];
  snprintf(topic, sizeof(topic), "guiver/%s/status", DEVICE_ID);
  publishJson(topic, doc, false, 0);
}
```

> **Nota:** i sensori temperatura non si sottoscrivono al topic `command` né pubblicano `response`.

### Template — Pompa (attuatore)

```cpp
void publishAnnounce() {
  StaticJsonDocument<256> doc;
  doc["type"]      = "pump";
  doc["name"]      = "Pozzo";

  JsonArray actuators = doc.createNestedArray("actuators");
  JsonObject p = actuators.createNestedObject();
  p["name"]  = "pump";
  p["label"] = "Pompa acqua";

  doc["interval"] = 30;
  // ... publish come sopra
}

void callback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<128> doc;
  deserializeJson(doc, payload, length);

  if (strcmp(doc["cmd"], "set_pump") == 0) {
    digitalWrite(D1, doc["value"] ? HIGH : LOW);

    StaticJsonDocument<64> state;
    state["running"] = doc["value"];
    publishResponse("ok", &state);
  }
}
```

### Checklist verifica firmware

Prima di considerare il firmware pronto, verificare:

| # | Test | Cosa controllare |
|---|------|-----------------|
| 1 | **WiFi + MQTT connect** | ESP si connette al broker con Client ID = `<device_id>` |
| 2 | **LWT** | `guiver/<id>/online` con retain, QoS 1, payload `0` |
| 3 | **Announce** | `guiver/<id>/announce` pubblicato retained, QoS 1 — Guiver registra il device |
| 4 | **Online** | `guiver/<id>/online` = `1` retained — Guiver vede online |
| 5 | **Status periodico** | `guiver/<id>/status` ogni `interval` s, QoS 0 — Guiver aggiorna dati |
| 6 | **Subscribe command** | ESP riceve `guiver/<id>/command` |
| 7 | **Response** | ESP pubblica `guiver/<id>/response` dopo ogni comando |
| 8 | **Disconnessione** | Spegnere ESP → LWT pubblica `0` → Guiver segna offline
