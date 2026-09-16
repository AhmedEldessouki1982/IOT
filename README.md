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
| `nestjs`     | Backend: MQTT + REST + Socket.IO gateway (single shared MQTT client) |
| `frontend`   | React + Vite + TypeScript + Tailwind + Zustand + Framer Motion command center UI (+ WebGL kitchen 3D viewer) |
| `mosquitto`  | MQTT broker config (local dev only)                              |

## What's Live vs Demo

The dashboard is a single-page bento-card grid of the apartment's 8 rooms
(Reception, Kitchen, Toilet, Corridor, Small Bedroom, Bedroom 2, Master
Bedroom, Ensuite) — 22 devices in total. Each card lists its devices; tapping
a card opens a room detail view with bulk actions (all lights on/off,
lock/unlock all). The Kitchen card also has a **3D** button that opens a
WebGL walkthrough of the room with live wifi-badge markers (see
[Kitchen 3D viewer](#kitchen-3d-viewer)).

### Live (real MQTT round-trip)
- **Reception Ceiling Light** (`light1`): the reference live device — an on/off
  toggle that round-trips the whole pipeline: UI → NestJS → Mosquitto → mock
  device (Python) → state echoes back over Socket.IO.
- **Reception Line 1 / Line 2 / Door Bulb** (`sonoff1/2/3`): the three relays of
  the physical Sonoff T3US3C wall switch flashed with Tasmota, driven over MQTT
  (`cmnd/…/POWER{1,2,3}`). Live when the switch is connected and broadcasting.

### Interactive but local-only (demo)
- **Front Door** lock: unlock/lock toggle with local state (no backend wiring yet).
- **All other room lights** (Kitchen, Toilet, Corridor, Small Bedroom,
  Bedroom 2, Master Bedroom, Ensuite): local toggles — they will round-trip
  over MQTT the moment a mock or live device publishes their id.
- **Kitchen appliances** (Oven, Dishwasher) and **Kitchen Smoke Sensor**:
  local on/off and arm-state toggles, mapped 1:1 to clickable markers inside
  the kitchen's 3D viewer.

### Read-only demo sensors
- **Room Temperature** (Reception, Kitchen, Master Bedroom): fixed demo
  readings with a small recent-history strip.
- **Gas Leak Detector** (Kitchen): static "safe" state.

Demo devices carry a clearly visible **demo** affordance in the UI so it is
always obvious what is wired to real hardware and what is not. The light/dark
theme and the emergency **Shutdown** button (all lights off, all doors locked)
work across both live and demo devices.

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

Open `http://localhost:5173` — the command center dashboard. Single page:
- `/` — bento-card dashboard (8 rooms · 16 devices) with room detail drill-in,
  light/dark theme toggle (persisted), live clock + connection status, and the
  emergency shutdown control

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

`src/sonoff/sonoff.service.ts` bridges the switch over the shared MQTT
connection (`MqttConnectionService` — the whole backend holds **one** broker
connection, shared with the `devices/+/state` listener and the command
publisher):
- **subscribes** to `stat/<SONOFF_BASE>/#` (matches POWER1/POWER2/POWER3) so
  every physical button press updates state in real time,
- **subscribes** to `devices/sonoff{1,2,3}/cmd` so REST/UI commands drive the
  relays,
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

## Kitchen 3D Viewer

The Kitchen card's **3D** button opens a lazy-loaded WebGL (three.js) popup of the
kitchen's GLB model. Devices from the dashboard are projected into the scene as
animated **wifi-badge markers** — green + heartbeat pulse when the device is on,
red slashed when off; hover to highlight, click to toggle (2D dashboard stays in
sync). Overlapping markers (e.g. ceiling light vs smoke sensor) are auto-separated
so none clip the ceiling.

The GLB is loaded from the stable path `frontend/src/3d/resources/kitchen.glb`,
which the Blender pipeline overwrites on every render — the dashboard always shows
"latest" with no code change. Dated exports stay alongside under
`resources/<yyyy-mm-dd>/` for provenance. It is code-split into its own chunk and
fetched **only when the popup opens** (~250 kB gzip + ~500 kB GLB; ~140 ms
click→canvas at 4× CPU throttle).

## Verification

```bash
# Quick test without the UI
mosquitto_sub -h localhost -t 'devices/+/state' -v
mosquitto_pub -h localhost -t 'devices/light1/cmd' -m '{"on": true}'
```
