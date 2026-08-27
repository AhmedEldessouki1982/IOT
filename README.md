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

| Variable      | Default                  | Purpose                       |
| ------------- | ------------------------ | ----------------------------- |
| `MQTT_URL`    | `mqtt://localhost:1883`  | MQTT broker URL               |
| `HTTP_PORT`   | `3000`                   | HTTP + WebSocket listen port  |
| `CORS_ORIGIN` | `http://localhost:5173`  | Allowed browser origin        |

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

To add a new device: publish to `devices/<newId>/state` and subscribe to `devices/<newId>/cmd`. Zero backend code changes needed.

## MQTT Topics

| Topic                   | Direction  | Payload                                              |
| ----------------------- | ---------- | ---------------------------------------------------- |
| `devices/light1/cmd`    | → device   | `{"on": true}` / `{"on": false}`                     |
| `devices/light1/state`  | device →   | `{"deviceId":"light1","type":"switch","state":{"on":true},"timestamp":"..."}` |
| `devices/+/state`       | device →   | Wildcard; NestJS extracts deviceId from topic        |

## Verification

```bash
# Quick test without the UI
mosquitto_sub -h localhost -t 'devices/+/state' -v
mosquitto_pub -h localhost -t 'devices/light1/cmd' -m '{"on": true}'
```
