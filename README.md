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
| `MQTT_URL`                | `mqtt://localhost:1883` | MQTT broker URL                                   |
| `HTTP_PORT`               | `3000`                  | HTTP + WebSocket listen port                      |
| `CORS_ORIGIN`             | `http://localhost:5173` | Allowed browser origin                            |
| `TUYA_DEVICE_ID`          | *(empty = disabled)*    | Tuya device id (see Local Tuya bridge below)      |
| `TUYA_LOCAL_KEY`          | *(empty = disabled)*    | Tuya local key                                    |
| `TUYA_DEVICE_IP`          | *(empty = auto-discover)*| Tuya device IP on the local network               |
| `TUYA_PROTOCOL_VERSION`   | `3.3`                   | Tuya protocol version (3.1 / 3.3 / 3.4 / 3.5)     |
| `TUYA_DEVICE_ID_MAPPING`  | `switch1`               | Internal id this Tuya device maps to on `devices/<id>/*` |

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

## Local Tuya Bridge (optional)

NestJS can control a local Tuya-protocol device (e.g. a Sonoff T3US3C wall switch
running stock firmware) **directly, without Home Assistant**, via the
[TuyAPI](https://github.com/codetheweb/tuyapi) package. `src/tuya/tuya.service.ts`
bridges that device into our generic MQTT device contract: it PUBLISHES device state
to `devices/<TUYA_DEVICE_ID_MAPPING>/state` and SUBSCRIBES to
`devices/<TUYA_DEVICE_ID_MAPPING>/cmd`, which are exactly the topics the existing
wildcard `devices/+/state` listener (and the `POST /devices/:id/command` flow) already
watch. So from the REST API, WebSocket gateway, and frontend's perspective this Tuya
switch is indistinguishable from any other MQTT-native device — it just happens to be
proxied by `TuyaService` under the hood. To change its mapped id later (or add more
Tuya devices), set `TUYA_DEVICE_ID_MAPPING` per device; **zero changes** to the generic
device layer are required.

If `TUYA_DEVICE_ID` or `TUYA_LOCAL_KEY` are left empty, `TuyaService` logs a clear
warning and skips connecting entirely, so the rest of the team can run the app normally
without real Tuya credentials.

### Obtaining credentials

Two common ways to get `TUYA_DEVICE_ID` and `TUYA_LOCAL_KEY`:

1. **Tuya IoT Platform** — create a project and a cloud device at
   [iot.tuya.com](https://iot.tuya.com). Add the device (linked from the TuyaSmart app),
   then read its device id / local key from the device's detail page under Project →
   Devices. Also set your project's **Data Center** to match your region, and note the
   protocol version shown for the device model.
2. **`tuya-cli` wizard** — install
   [tuya-cli](https://github.com/tuya/tuya-cli) (`npm i -g @tuyapi/cli`), run
   `tuya-cli wizard`, follow the prompts (region, username/password, to get an access
   token), then `tuya-cli list` prints each device with its `id` and `key`.

`TUYA_DEVICE_IP` is optional: TuyAPI auto-discovers the device on the LAN, but an
explicit IP makes startup faster and more reliable. `TUYA_PROTOCOL_VERSION` defaults to
`3.3`; use the version your device's firmware reports.

## Verification

```bash
# Quick test without the UI
mosquitto_sub -h localhost -t 'devices/+/state' -v
mosquitto_pub -h localhost -t 'devices/light1/cmd' -m '{"on": true}'
```
