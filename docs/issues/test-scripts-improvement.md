# Test scripts: analizzare e riscrivere test interattivi migliori

## Stato attuale

### tests/wsserver_test.js (154 righe)
- CLI interattiva via readline su ws://127.0.0.1:7777/
- Comandi: on, loop, unloop, w, s, r, i, p, crypto, color
- Hardcoded porta WS, output raw JSON

### tests/wether_test.js (5 righe)
- Crea Weather_module, chiama get_weather() senza parametri
- Zero asserzioni

## Cosa manca
- Nessun test automatizzato (Jest/Vitest)
- Nessun mock per RabbitMQ/LinkManager
- Test manuali con porte hardcoded

## Obiettivi

### Fase 1 — Script interattivi migliorati (TS)
- wsserver_test.ts: porta configurabile, output formattato, help interattivo
- wether_test.ts: città da CLI, output meteo formattato

### Fase 2 — Test automatizzati
- Setup Jest/Vitest + mock RabbitMQ
- Test unitari Module, Core, moduli command
- Mock per pigpio, axios, dgram

### Fase 3 — Nuovi test
- crypto, room_temp, delay, loop_task, info_point, API REST
