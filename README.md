# IoT Smart Light — Minimal End-to-End Proof of Concept

A minimal IoT loop: **Python mock light → MQTT → NestJS → WebSocket → React UI**.

```
        POST /light/toggle           publish "on"/"off"
  UI ───────────────────►  NestJS  ───────────────────────►  Mosquitto
   ▲                          │                                   │
   │  socket.io "light:state"  │  subscribe devices/light1/state   │ subscribe cmd
   └───────────────────────────┘◄──────────────────────────────────┘
                                        publish JSON state     Mock light
```

## Parts

| Folder       | Role                                                            |
| ------------ | --------------------------------------------------------------- |
| `mock-device`| Python script simulating one smart light (`light_switch.py`)    |
| `nestjs`     | Backend: MQTT microservice + REST + Socket.IO gateway           |
| `frontend`   | React + Vite + TypeScript + Tailwind + Zustand "Room Control" UI|

## 1. Start Mosquitto

Via Docker Compose (recommended):

```bash
docker compose up -d
```

Or directly:

```bash
docker run -d --name mosquitto -p 1883:1883 eclipse-mosquitto:2
```

The `eclipse-mosquitto:2` image listens on `1883` and allows anonymous access
by default — no config file needed for this PoC.

No Docker? Install Mosquitto natively instead:

```bash
# Debian/Ubuntu
sudo apt install mosquitto
# macOS
brew install mosquitto
```

and start it with `mosquitto` (it listens on `1883` by default).

## 2. Start the mock device

```bash
cd mock-device
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python light_switch.py
```

On startup it publishes the initial state (`off`) to `devices/light1/state`,
then subscribes to `devices/light1/cmd`. You should see logs like:

```
[command] devices/light1/cmd: on
[publish] devices/light1/state: {'deviceId': 'light1', 'state': 'on', 'timestamp': '...'}
```

## 3. Start the NestJS backend

```bash
cd nestjs
npm install
npm run start:dev
```

Starts an HTTP server on `http://localhost:3000` and connects to the MQTT
broker at `mqtt://localhost:1883`.

- `GET  /light/state` — last known state.
- `POST /light/toggle` — flips the light and publishes the command.

## 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — a terminal-styled "Room Control" dashboard with
four rooms. The **Reception → Main Light** toggle is live: it calls the NestJS
API (`POST /light/toggle`), which drives the mock device over MQTT, and the UI
updates via the `light:state` Socket.IO event (no polling). The other toggles
and the temperature readout are dummy placeholders — purely local state.
The header shows `[ONLINE]`/`[OFFLINE]` based on the WebSocket connection.

## MQTT topics & message formats

| Topic                       | Direction  | Payload                              |
| --------------------------- | ---------- | ------------------------------------ |
| `devices/light1/cmd`        | → device   | raw string: `"on"` or `"off"`        |
| `devices/light1/state`      | device →   | JSON: `{"deviceId":"light1","state":"on","timestamp":"<ISO-8601>"}` |

The device simulates a ~300 ms actuator delay between receiving a command and
publishing the resulting state. The backend stores the latest state in memory
and broadcasts it to all connected clients via the `light:state` Socket.IO
event.

## Quick verification without the UI

```bash
# subscribe to state, then publish a command
mosquitto_sub -h localhost -t 'devices/light1/state' -v
mosquitto_pub -h localhost -t 'devices/light1/cmd' -m on
```

## Scope

Single device (`light1`), single feature module, no auth, no database, no
persistence — intentionally minimal.