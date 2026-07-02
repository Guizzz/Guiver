# WebSocket Commands — Guiver

## Connessione

```
ws://<host>:<WSS_CLI_PORT>/
```

Dopo aver stabilito la connessione, il client deve inviare un messaggio con il proprio identificativo:

```json
{
  "client_id": "my-unique-client-id"
}
```

Se `client_id` è assente, il server risponde con:

```json
{
  "error": "Client_id missing"
}
```

Alla verifica, il server invia automaticamente la lista completa degli ESP (`esp_list`) al nuovo client.

---

## Formato messaggi

### Richiesta (client → server)

```json
{
  "type": "request",
  "command": "<command_name>",
  "id": "uuid",
  "client_id": "my-client",
  "payload": { }
}
```

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|-------------|-------------|
| `type` | string | sì | `"request"` |
| `command` | string | sì | Nome del comando |
| `id` | string | sì | UUID per correlare richiesta e risposta |
| `client_id` | string | sì | Identificativo client (inviato all'auth) |
| `payload` | object | no | Parametri specifici del comando |

### Risposta successo (server → client)

```json
{
  "id": "uuid",
  "type": "response",
  "command": "<command_name>",
  "payload": { },
  "timestamp": 1719876543210
}
```

### Risposta errore (server → client)

```json
{
  "type": "response",
  "command": "<command_name>",
  "error": "Descrizione errore",
  "timestamp": 1719876543210
}
```

### Routing risposte

- Se la risposta contiene `client_id` → inviata **solo al client specifico**.
- Se **non** contiene `client_id` → **broadcast** a tutti i client connessi.

---

## Comandi

### `list_commands` — Lista comandi disponibili

Built-in gestito direttamente da Core. Restituisce tutti i comandi attualmente registrati.

**Richiesta:**
```json
{
  "type": "request",
  "command": "list_commands",
  "id": "uuid",
  "client_id": "my-client"
}
```

**Risposta:**
```json
{
  "payload": ["get_weather", "get_crypto_data", "esp_list", "esp_get", "esp_command"]
}
```

---

### `get_weather` — Meteo

Modulo: `weather_queue`

**Richiesta:**
```json
{
  "type": "request",
  "command": "get_weather",
  "id": "uuid",
  "client_id": "my-client",
  "payload": {
    "city": "london"
  }
}
```

`city` è opzionale (default: `"latina"`).

**Risposta:**
```json
{
  "id": "uuid",
  "type": "response",
  "command": "get_weather",
  "payload": {
    "city": "London",
    "temp": 22.5,
    "humidity": 65,
    "weather": "clear sky"
  },
  "timestamp": 1719876543210
}
```

---

### `get_crypto_data` — Criptovalute

Modulo: `crypto_queue`

Restituisce i prezzi correnti di Bitcoin e Solana da CoinCap.

**Richiesta:**
```json
{
  "type": "request",
  "command": "get_crypto_data",
  "id": "uuid",
  "client_id": "my-client",
  "payload": {}
}
```

**Risposta:**
```json
{
  "id": "uuid",
  "type": "response",
  "command": "get_crypto_data",
  "payload": [
    {
      "id": "bitcoin",
      "rank": "1",
      "symbol": "BTC",
      "name": "Bitcoin",
      "priceUsd": "65432.10"
    },
    {
      "id": "solana",
      "rank": "5",
      "symbol": "SOL",
      "name": "Solana",
      "priceUsd": "143.21"
    }
  ],
  "timestamp": 1719876543210
}
```

---

### `esp_list` — Lista dispositivi ESP

Modulo: `esp_manager_queue`

**Richiesta:**
```json
{
  "type": "request",
  "command": "esp_list",
  "id": "uuid",
  "client_id": "my-client",
  "payload": {
    "type": "led"
  }
}
```

`payload.type` è opzionale; se presente filtra i dispositivi per tipo.

**Risposta (targeted — solo al client richiedente):**
```json
{
  "id": "uuid",
  "type": "response",
  "command": "esp_list",
  "payload": {
    "total": 3,
    "online": 2,
    "devices": [
      {
        "id": "esp-led-01",
        "type": "led",
        "name": "Living Room LED",
        "online": true,
        "lastSeen": 1719876540000,
        "interval": 30000,
        "data": { "brightness": 75 },
        "sensors": ["temperature"],
        "actuators": [{ "name": "led", "label": "LED Strip" }]
      }
    ]
  },
  "client_id": "my-client",
  "timestamp": 1719876543210
}
```

---

### `esp_get` — Dettaglio singolo ESP

Modulo: `esp_manager_queue`

**Richiesta:**
```json
{
  "type": "request",
  "command": "esp_get",
  "id": "uuid",
  "client_id": "my-client",
  "payload": {
    "id": "esp-led-01"
  }
}
```

`payload.id` è obbligatorio.

**Risposta:**
```json
{
  "id": "uuid",
  "type": "response",
  "command": "esp_get",
  "payload": {
    "id": "esp-led-01",
    "type": "led",
    "name": "Living Room LED",
    "online": true,
    "lastSeen": 1719876540000,
    "interval": 30000,
    "data": { "brightness": 75 },
    "sensors": ["temperature"],
    "actuators": [{ "name": "led", "label": "LED Strip" }]
  },
  "timestamp": 1719876543210
}
```

**Errore — ID mancante:**
```json
{
  "type": "response",
  "command": "esp_get",
  "error": "Missing device id",
  "timestamp": 1719876543210
}
```

**Errore — dispositivo non trovato:**
```json
{
  "id": "esp-nonexistent",
  "type": "response",
  "command": "esp_get",
  "error": "Device not found: esp-nonexistent",
  "timestamp": 1719876543210
}
```

---

### `esp_command` — Invia comando a un ESP

Modulo: `esp_manager_queue`

Invia un comando MQTT al dispositivo ESP. La risposta conferma solo l'invio — l'effettiva esecuzione è notificata come evento `esp_status`.

**Richiesta:**
```json
{
  "type": "request",
  "command": "esp_command",
  "id": "uuid",
  "client_id": "my-client",
  "payload": {
    "id": "esp-led-01",
    "cmd": "set_color",
    "color": "#00ff00",
    "brightness": 100
  }
}
```

| Campo | Obbligatorio | Descrizione |
|-------|-------------|-------------|
| `payload.id` | sì | ID del dispositivo ESP target |
| `payload.cmd` | sì | Comando da eseguire |
| `payload.*` | no | Parametri aggiuntivi inoltrati all'ESP |

Il payload MQTT inviato all'ESP sarà: `{"cmd": "set_color", "color": "#00ff00", "brightness": 100}`

**Risposta:**
```json
{
  "id": "uuid",
  "type": "response",
  "command": "esp_command",
  "payload": {
    "status": "command_sent",
    "device": "esp-led-01",
    "topic": "guiver/esp-led-01/command"
  },
  "timestamp": 1719876543210
}
```

**Errore — ID mancante:**
```json
{
  "type": "response",
  "command": "esp_command",
  "error": "Missing device id",
  "timestamp": 1719876543210
}
```

---

## Eventi push (broadcast)

Eventi inviati automaticamente dal server senza richiesta del client.

### `esp_announce` — Nuovo ESP connesso

Inviato quando un ESP pubblica su `guiver/<id>/announce`.

```json
{
  "id": "uuid",
  "type": "response",
  "command": "esp_announce",
  "payload": {
    "device": {
      "id": "esp-led-01",
      "type": "led",
      "name": "Living Room LED",
      "online": true,
      "lastSeen": 1719876540000,
      "interval": 30000,
      "data": {},
      "sensors": ["temperature"],
      "actuators": [{ "name": "led", "label": "LED Strip" }]
    }
  },
  "timestamp": 1719876543210
}
```

---

### `esp_status` — Aggiornamento stato ESP

Inviato quando un ESP pubblica su `guiver/<id>/status`. Se il dispositivo non è stato precedentemente annunciato, il messaggio viene ignorato.

```json
{
  "id": "uuid",
  "type": "response",
  "command": "esp_status",
  "payload": {
    "id": "esp-led-01",
    "data": {
      "temperature": 22.5,
      "humidity": 60,
      "led_state": "on"
    },
    "lastSeen": 1719876543210
  },
  "timestamp": 1719876543210
}
```

I nuovi campi si fondono con i dati esistenti del dispositivo.

---

### `esp_online` — Cambio stato online/offline

Inviato quando:
- Un ESP pubblica `"true"`/`"1"` o `"false"`/`"0"` su `guiver/<id>/online`
- Il timeout di 15s rileva un ESP non raggiungibile (`now - lastSeen > interval * 3`)

Se il dispositivo non è conosciuto, il messaggio MQTT viene ignorato.

```json
{
  "id": "uuid",
  "type": "response",
  "command": "esp_online",
  "payload": {
    "id": "esp-led-01",
    "online": true
  },
  "timestamp": 1719876543210
}
```

---

## Riepilogo

| Comando | Tipo | Payload richiesto | Routing |
|---------|------|-------------------|---------|
| `list_commands` | request/response | — | broadcast |
| `get_weather` | request/response | `city` (opt) | broadcast |
| `get_crypto_data` | request/response | — | broadcast |
| `esp_list` | request/response | `type` (opt) | **targeted** |
| `esp_get` | request/response | `id` (req) | broadcast |
| `esp_command` | request/response | `id`, `cmd` (req) | broadcast |
| `esp_announce` | push | — | broadcast |
| `esp_status` | push | — | broadcast |
| `esp_online` | push | — | broadcast |
