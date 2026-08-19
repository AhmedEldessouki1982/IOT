# IoT Smart Light — Minimal End-to-End Proof of Concept

A minimal IoT loop: **Python mock device → MQTT → NestJS → WebSocket → React UI**.

```
        POST /devices/:id/command        publish JSON command
  UI ───────────────────────►  NestJS  ───────────────────────────►  Mosquitto
   ▲                            │                                        │
   │  socket.io "device:state"   │  subscribe devices/+/state (wildcard) │ subscribe cmd
   └─────────────────────────────┘◄──────────────────────────────────────┘
                                          publish JSON DeviceState     Mock device
```

## Parts

| Folder       | Role                                                            |
| ------------ | --------------------------------------------------------------- |
| `mock-device`| Python script simulating a smart switch (`light_switch.py`)     |
| `nestjs`     | Backend: MQTT + REST + Socket.IO gateway                        |
| `frontend`   | React + Vite + TypeScript + Tailwind + Zustand "Room Control" UI|
| `mosquitto`  | MQTT broker config (local dev only)                             |

## 1. Start Mosquitto

The broker now uses a config file mounted into the container:

```bash
docker compose up -d
```

The config lives in `mosquitto/config/mosquitto.conf`:

```
listener 1883
allow_anonymous true
```

> **Why it's needed:** the `eclipse-mosquitto:2` image defaults to a
> non-listening, `allow_anonymous false` setup, so it would refuse connections
> without an explicit `listener` + `allow_anonymous`. **This is for LOCAL DEV
> ONLY** — before any real deployment, replace anonymous access with
> username/password authentication and/or TLS certificates.

No Docker? Install Mosquitto natively instead:

```bash
# Debian/Ubuntu
sudo apt install mosquitto
# macOS
brew install mosquitto
```

and point it at the same config with `mosquitto -c mosquitto/config/mosquitto.conf`.

## 2. Configure the backend (.env)

Copy the committed example and tweak if needed:

```bash
cd nestjs
cp .env.example .env   # already present if you're on this machine
```

`.env` variables (all optional — sensible defaults exist):

| Variable      | Default                  | Purpose                       |
| ------------- | ------------------------ | ----------------------------- |
| `MQTT_URL`    | `mqtt://localhost:1883`  | MQTT broker URL               |
| `HTTP_PORT`   | `3000`                   | HTTP + WebSocket listen port  |
| `CORS_ORIGIN` | `http://localhost:5173`  | Allowed browser origin (REST + Socket.IO) |

`.env` is git-ignored; only `.env.example` is committed.

## 3. Start the mock device

```bash
cd mock-device
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python light_switch.py
```

On startup it publishes the initial state to `devices/light1/state`, then
subscribes to `devices/light1/cmd`. You should see logs like:

```
[command] devices/light1/cmd: {'on': True}
[publish] devices/light1/state: {'deviceId': 'light1', 'type': 'switch', 'state': {'on': True}, 'timestamp': '...'}
```

## 4. Start the NestJS backend

```bash
cd nestjs
npm install
npm run start:dev
```

Starts an HTTP server on `http://localhost:3000` and connects to the MQTT
broker using the `MQTT_URL` from `.env`.

### Generic device API

The backend is **device-agnostic** — there is no per-device module. Devices are
discovered automatically from MQTT.

| Method | Endpoint                 | Description                              |
| ------ | ------------------------ | ---------------------------------------- |
| `GET`  | `/devices`               | All known device states                  |
| `GET`  | `/devices/:id`           | One device's state (404 if unknown)      |
| `POST` | `/devices/:id/command`   | Send a JSON command object to a device   |

Example:

```bash
curl http://localhost:3000/devices
curl http://localhost:3000/devices/light1
curl -X POST http://localhost:3000/devices/light1/command \
     -H 'Content-Type: application/json' -d '{"on": false}'
```

### How devices register themselves

The backend subscribes to the **wildcard topic `devices/+/state`** (single-level
MQTT wildcard). Any device that publishes a `DeviceState` JSON payload to
`devices/<newId>/state`:

1. is added to the in-memory device map automatically, and
2. has its state broadcast to all WebSocket clients as `device:state`.

**To add a new device you need zero new NestJS code** — just publish to
`devices/<newId>/state` (and subscribe to `devices/<newId>/cmd` for commands).

## 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — a terminal-styled "Room Control" dashboard with
four rooms. The **Reception → Main Light** toggle is live: it calls the NestJS
API, which drives the mock device over MQTT, and the UI updates via the
`device:state` Socket.IO event (no polling). The other toggles and the
temperature readout are dummy placeholders — purely local state. The header
shows `[ONLINE]`/`[OFFLINE]` based on the WebSocket connection.

## MQTT topics & message formats

| Topic                   | Direction  | Payload                                              |
| ----------------------- | ---------- | ---------------------------------------------------- |
| `devices/light1/cmd`    | → device   | JSON: `{"on": true}` / `{"on": false}`               |
| `devices/light1/state`  | device →   | JSON `DeviceState`: `{"deviceId":"light1","type":"switch","state":{"on":true},"timestamp":"<ISO-8601>"}` |
| `devices/+/state`       | device →   | Wildcard subscription; NestJS routes by `deviceId` extracted from the topic |

The device simulates a ~300 ms actuator delay between receiving a command and
publishing the resulting state. The backend stores the latest state in memory
and broadcasts it to all connected clients via the `device:state` Socket.IO
event.

## Quick verification without the UI

```bash
# subscribe to state, then publish a JSON command
mosquitto_sub -h localhost -t 'devices/+/state' -v
mosquitto_pub -h localhost -t 'devices/light1/cmd' -m '{"on": true}'
```

## Scope

Single switch device (`light1`) simulating the generic contract; no auth, no
database, no persistence — intentionally minimal. The generic device layer is
already in place, so adding more switches, sensors, or locks is purely a
firmware/device-side change.