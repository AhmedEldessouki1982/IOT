# IoT Smart Home — Command Center

A premium IoT smart-home dashboard: **Python mock device → MQTT → NestJS → WebSocket → React UI**.

```
        POST /devices/:id/command        publish JSON command
  UI ───────────────────────►  NestJS  ───────────────────────────►  Mosquitto
   ▲                            │                                        │
   │  socket.io "device:state"   │  subscribe devices/+/state (wildcard) │ subscribe cmd
   └─────────────────────────────┘◄──────────────────────────────────────┘
                                          publish JSON DeviceState     Mock device
```

## Architecture

| Folder       | Role                                                             |
| ------------ | ---------------------------------------------------------------- |
| `mock-device`| Python script simulating a smart switch (`light_switch.py`)      |
| `nestjs`     | Backend: MQTT + REST + Socket.IO gateway                         |
| `frontend`   | React + Vite + TypeScript + Tailwind + Zustand command center UI |
| `mosquitto`  | MQTT broker config (local dev only)                              |

## What's Live vs Demo

### Live (real MQTT round-trip)
- **Reception → Main Light** (`light1`): toggle, brightness, color temperature — drives the mock device over MQTT, state updates via Socket.IO. The only real device today.

### Interactive but local-only
- **All other room toggles** (Dining, Bathroom, Master Bedroom lights): respond to taps with local state, but no backend wiring. Will work the moment a second mock device is added.

### Visual preview only (no backend)
- **Scenes tab**: scene cards (Evening, Away, Entertain, Night) — visual architecture awaiting backend scene engine.
- **Energy tab**: "1.2 kW" consumption chart — placeholder data, no metering backend yet.
- **Security tab**: lock status, smoke/gas indicators — shows static states; the smart lock is interactive on the `/2d` floorplan but the Security tab's values are hardcoded.

All preview/demo sections display a clearly visible **Preview** or **Demo Data** badge near their header.

## Quick Start

### 1. Start Mosquitto

```bash
docker compose up -d
```

Config lives in `mosquitto/config/mosquitto.conf`:
```
listener 1883
allow_anonymous true
```

> **LOCAL DEV ONLY** — before deployment, replace anonymous access with authentication and TLS.

### 2. Configure the backend (.env)

```bash
cd nestjs
cp .env.example .env
```

| Variable                  | Default                 | Purpose                                           |
| ------------------------- | ----------------------- | ------------------------------------------------- |
| `MQTT_URL`                | `mqtt://localhost:1883` | MQTT broker host + port                           |
| `HTTP_PORT`               | `3000`                  | HTTP + WebSocket listen port                      |
| `CORS_ORIGIN`             | `http://localhost:5173` | Allowed browser origin                            |
| `SONOFF_BASE` | `tasmota_A3AECD` | Tasmota topic base of the Sonoff switch (*empty = disabled*) |
| `SONOFF_IP`   | `10.0.1.13`    | Sonoff device IP (informational; control goes via broker) |

### 3. Start the mock device

```bash
cd mock-device
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python light_switch.py
```

### 4. Start the NestJS backend

```bash
cd nestjs
npm install
npm run start:dev
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — the command center dashboard. Routes:
- `/` — multi-tab command center (Overview, Rooms, Devices, Scenes, Energy, Security)
- `/2d` — interactive 2D apartment floorplan with per-device control panel

## Device API

The backend is device-agnostic — devices register automatically over MQTT.

| Method | Endpoint                 | Description                        |
| ------ | ------------------------ | ---------------------------------- |
| `GET`  | `/devices`               | All known device states            |
| `GET`  | `/devices/:id`           | One device's state (404 if unknown)|
| `POST` | `/devices/:id/command`   | Send a JSON command to a device    |
| `GET`  | `/sonoff`                | State of all three Sonoff relays (sonoff1..3) |
| `GET`  | `/sonoff/:channel`       | State of one relay (1..3)          |
| `POST` | `/sonoff/:channel/command` | Force a relay, body `{"on": true\|false}` |

To add a new device: publish to `devices/<newId>/state` and subscribe to `devices/<newId>/cmd`. Zero backend code changes needed.

## MQTT Topics

| Topic                   | Direction  | Payload                                              |
| ----------------------- | ---------- | ---------------------------------------------------- |
| `devices/light1/cmd`    | → device   | `{"on": true}` / `{"on": false}`                     |
| `devices/light1/state`  | device →   | `{"deviceId":"light1","type":"switch","state":{"on":true},"timestamp":"..."}` |
| `devices/+/state`       | device →   | Wildcard; NestJS extracts deviceId from topic        |
| `cmnd/<base>/POWER{1,2,3}` | → switch | `ON` / `OFF`                                       |
| `stat/<base>/POWER#`    | switch →   | `ON` / `OFF` per relay (Sonoff broadcasts)           |

## Sonoff T3US3C 3-gang switch (flashed Tasmota)

The physical wall switch is a Sonoff T3US3C flashed with **Tasmota** (MQTT-native,
no cloud, no Tuya). Its three independent on/off relays are driven and read directly
over MQTT through the shared Mosquitto broker — no gateway, no Home Assistant.

`src/sonoff/sonoff.service.ts` owns its own raw MQTT client:
- **subscribes** to `stat/<SONOFF_BASE>/POWER#` (matches POWER1/POWER2/POWER3) so
  every physical button press updates state in real time,
- **publishes** `ON`/`OFF` to `cmnd/<SONOFF_BASE>/POWER{1,2,3}` to drive each relay.

Each POWER channel is surfaced as a normal app device (`sonoff1`, `sonoff2`,
`sonoff3`) through the existing `DeviceService` registry + WebSocket gateway — the
frontend treats them exactly like the live `light1`. State also arrives via the
REST endpoints above.

If `SONOFF_BASE` is left empty, `SonoffService` logs a warning and skips connecting,
so the app runs normally without the hardware attached.

### Wiring / channel mapping

| Channel | Tasmota cmd | Device id | Frontend label  |
| ------- | ----------- | --------- | --------------- |
| 1       | `POWER1`    | `sonoff1` | Reception Line 1|
| 2       | `POWER2`    | `sonoff2` | Reception Line 2|
| 3       | `POWER3`    | `sonoff3` | Door Bulb       |

### HTTP control fallback (direct to the switch, not via broker)

For direct control/status you can also hit the switch's Tasmota HTTP API at
`http://10.0.1.13/cm?cmnd=...` (toggle, e.g. `POWER1%20TOGGLE`; status via
`Status%200`). The app itself always uses MQTT; this HTTP route is a manual/dev fallback.

## Verification

```bash
# Quick test without the UI
mosquitto_sub -h localhost -t 'devices/+/state' -v
mosquitto_pub -h localhost -t 'devices/light1/cmd' -m '{"on": true}'
```
