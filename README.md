# IoT Smart Home Command Center

A local-first smart-home dashboard and MQTT bridge for an apartment installation:
**mock/live devices -> Mosquitto -> NestJS -> Socket.IO/REST -> React UI**.

```
        POST /devices/:id/command        publish JSON command
  UI ----------------------->  NestJS  -------------------------->  Mosquitto
   ^                            |                                      |
   |  socket.io device:state     |  subscribe devices/+/state          | devices
   |  socket.io timer:update     |  subscribe stat/<base>/#            | Tasmota
   +----------------------------+<-------------------------------------+
```

## Architecture

| Folder        | Role                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `mock-device` | Python MQTT mock for the reference `light1` switch                                                       |
| `nestjs`      | NestJS backend with REST, Socket.IO, one shared MQTT connection, Sonoff routing, persistence, and timers |
| `frontend`    | React + Vite + TypeScript dashboard for rooms, scenes, device health, activity, and settings             |
| `mosquitto`   | Local-development MQTT broker config                                                                     |

## Dashboard Scope

The frontend source of truth is `frontend/src/dashboard/rooms.ts`. It currently defines **7 rooms** and **26 UI devices**:

| Room          | Devices                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Reception     | Ceiling light, front door, room temperature, Reception Line 1, Reception Line 2, Door Bulb            |
| Kitchen       | Main light, gas detector, room temperature, three kitchen light zones, oven, dishwasher, smoke sensor |
| Main Toilet   | LED profile, Spotlights, Exhaust fan (live routine gangs `toilet-main-g1..3`)                          |
| Corridor      | Corridor light                                                                                        |
| Small Bedroom | Bedroom light                                                                                         |
| Bedroom 2     | Bedroom light                                                                                         |
| Master Suite  | Bedroom light, room temperature, toilet LED bar, toilet spotlights, exhaust fan                       |

Live MQTT-backed ids today are `light1`, `sonoff1`, `sonoff2`, `sonoff3`, and the
Main Toilet routine gangs `toilet-main-g1`, `toilet-main-g2`, `toilet-main-g3`.
The remaining UI devices are local demo controls or read-only demo sensors until
their real ids are added to the room config and backend registry.

The 3D feature is deliberately isolated for now. This active dashboard does not expose a 3D viewer or GLB workflow.

## Quick Start

### 1. Start Mosquitto

```bash
docker compose up -d
```

Local broker config lives in `mosquitto/config/mosquitto.conf`:

```conf
listener 1883
allow_anonymous true
```

This repo intentionally keeps the local broker simple. Production security is parked for a later pass.

### 2. Configure Backend

```bash
cd nestjs
cp .env.example .env
```

| Variable               | Default/example         | Purpose                                                                        |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| `MQTT_URL`             | `mqtt://localhost:1883` | MQTT broker URL                                                                |
| `HTTP_PORT`            | `3000`                  | Backend HTTP and Socket.IO port; change this if another service owns the port  |
| `CORS_ORIGIN`          | `http://localhost:5173` | Browser origin allowed to call the backend                                     |
| `DATA_DIR`             | `.data`                 | JSON persistence directory for latest device state, history, and active timers |
| `SONOFF_BASE`          | `tasmota_A3AECD`        | Legacy single-switch topic base for Reception; creates `sonoff1..3`            |
| `SONOFF_IP`            | `10.0.1.13`             | Informational only; control goes through MQTT                                  |
| `SONOFF_SWITCHES_JSON` | unset                   | Optional multi-switch registry JSON; takes precedence over `SONOFF_BASE`       |
| `SONOFF_SWITCHES_FILE` | unset                   | Optional path to a registry JSON file when inline JSON is not used             |

### 3. Start Services

```bash
cd mock-device
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python light_switch.py
```

```bash
cd nestjs
npm install
npm run start:dev
```

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown by the frontend dev server.

## Device Contracts

The generic app contract is JSON over `devices/<id>/state` and `devices/<id>/cmd`.

| Topic                | Direction         | Payload                                                                     |
| -------------------- | ----------------- | --------------------------------------------------------------------------- |
| `devices/<id>/cmd`   | Backend -> device | `{"on": true}` or `{"on": false}`                                           |
| `devices/<id>/state` | Device -> backend | `{"deviceId":"<id>","type":"switch","state":{"on":true},"timestamp":"..."}` |
| `devices/+/state`    | Device -> backend | Wildcard subscription used by NestJS                                        |

REST and Socket.IO contracts kept stable:

| Method/event | Path/event                | Purpose                                                            |
| ------------ | ------------------------- | ------------------------------------------------------------------ |
| `GET`        | `/devices`                | All known device states                                            |
| `GET`        | `/devices/:id`            | One known device state                                             |
| `GET`        | `/devices/:id/history`    | Recent persisted history for one device                            |
| `POST`       | `/devices/:id/command`    | Publish a JSON command to `devices/<id>/cmd`                       |
| `GET`        | `/api/timers`             | Active timers as `{ deviceId, gang, expiresAt, remainingSeconds }` |
| `POST`       | `/api/devices/:id/button` | Manual/test trigger for timer press handling                       |
| `GET`        | `/api/rooms`              | Every routine room with roles, live state and timers              |
| `GET`        | `/api/rooms/:roomId`      | One routine room                                                   |
| `POST`       | `/api/rooms/:roomId/gangs/:gang/press` | Advance one press stage (`10m` → `30m` → `off`)   |
| `DELETE`     | `/api/rooms/:roomId/gangs/:gang/timer` | Cancel a gang countdown                            |
| Socket.IO    | `device:state`            | Latest device state                                                |
| Socket.IO    | `timer:update`            | Full active timer list                                             |

The older `/sonoff` routes are still available for Reception relay compatibility. Route prefixes are intentionally mixed (`/devices`, `/sonoff`, `/api/timers`, `/api/devices/:id/button`, `/api/rooms`) to preserve the existing contracts.

## Sonoff Registry

Tasmota Sonoff T3US3C switches are bridged by `SonoffService` through the single shared `MqttConnectionService`; the backend does not open a second MQTT client.

Tasmota topics:

| Topic                  | Direction         | Payload                                        |
| ---------------------- | ----------------- | ---------------------------------------------- |
| `cmnd/<base>/POWER<n>` | Backend -> switch | `ON` or `OFF`                                  |
| `stat/<base>/POWER<n>` | Switch -> backend | `ON` or `OFF`                                  |
| `stat/<base>/RESULT`   | Switch -> backend | Button action JSON, when configured in Tasmota |

Use `SONOFF_SWITCHES_JSON` or `SONOFF_SWITCHES_FILE` for multiple wall switches. Each registry entry is:

```json
{
  "switchId": "toilet-main",
  "base": "mainToilet",
  "gangs": 3,
  "roomType": "toilet",
  "roomId": "toilet"
}
```

Fields:

| Field        | Meaning                                          |
| ------------ | ------------------------------------------------ |
| `switchId`   | Stable app id for the physical switch            |
| `base`       | Tasmota MQTT topic base                          |
| `gangs`      | Relay count: `1`, `2`, or `3`                    |
| `roomType`   | Timer profile: `toilet`, `bedroom`, or `none`    |
| `roomId`     | Stable room id for future customer configuration |
| `buttonMode` | `local` = a wall touch drives its own relay, so the switch works offline and the backend only adds the timer; `detached` (default) = the backend drives the relay |

Backward compatibility: when only `SONOFF_BASE` is set, it creates a legacy Reception registry entry with `switchId: "reception"`, `roomType: "none"`, and device ids `sonoff1`, `sonoff2`, `sonoff3`. New switches generate deterministic ids as `<switchId>-g<n>`, for example `toilet-main-g1`.

Example registry with Reception plus one toilet switch:

```json
[
  {
    "switchId": "reception",
    "base": "tasmota_A3AECD",
    "gangs": 3,
    "roomType": "none",
    "roomId": "reception"
  },
  {
    "switchId": "toilet-main",
    "base": "mainToilet",
    "gangs": 3,
    "roomType": "toilet",
    "roomId": "toilet",
    "buttonMode": "local"
  }
]
```

Do not add registry entries for rooms until the actual Tasmota topic base and room mapping are known.

## Routines

Routine presets live in one place: `nestjs/src/routines/routine.config.ts`.
`nestjs/src/timers/timer.config.ts` derives `TIMER_RULES` from them, so there is
no duplicate table.

Every gang is driven by **clicks, not press length**. A dashboard click advances
one stage; the click after the last stage switches the gang off. A `detached`
wall switch behaves the same way (a tap `SINGLE` and a hold `HOLD` are each one
click), while a `local` wall switch is a plain on/off — the device switches its
own relay, which is what keeps it working offline, and the backend adds the
gang's first stage as a supervisor auto-off.

| Room type | Gang          | Click cycle                 |
| --------- | ------------- | --------------------------- |
| `toilet`  | 1 LED profile | 10 min → 30 min → off       |
| `toilet`  | 2 spotlights  | 10 min → 30 min → off       |
| `toilet`  | 3 exhaust fan | 10 min → off (single stage) |
| `bedroom` | 1 LED         | on/off toggle (no timer)    |
| `bedroom` | 2 spotlights  | 20 min → 30 min → off       |
| `none`    | any           | plain relay toggle          |

`RoutinesModule` exposes each routine room as roles + stage lists + the card
hint (`10m → 30m → off`) + live state + timers (`GET /api/rooms/...`) and
accepts a press that advances a stage. The dashboard renders this with the
reusable `RoutinePanel` / `RoutineGangCard` components
(`frontend/src/features/routines/`), so a second toilet (e.g. the master) is one
registry entry with `roomType: "toilet"` and its own `roomId` — no new code.

Press behavior:

- A click while no timer runs arms stage 1 (10 min) and turns the relay on.
- A click while a stage runs arms the next stage with a **fresh full duration** (a second click restarts a full 30 min, it does not add on).
- The click after the last stage switches the relay off and cancels the timer.
- The current stage is derived from the running timer's duration, so it survives a backend restart.
- A gang that is on **without** a timer (e.g. set by a scene) is switched off by the next click.
- On a `local` wall switch, a touch that switches the relay **on** arms stage 1 (10 min) as a supervisor auto-off, unless a stage is already running.
- On a `local` wall switch, a touch that switches it **off** cancels that gang's timer, like any other off. The wall keeps working with no timer while the backend, broker or network is down.
- Manual OFF from UI or device state cancels that gang's active timer.
- Active timers persist under `DATA_DIR` and are restored after restart. Expired persisted timers publish OFF after the MQTT connection is ready.

Frontend timer badges use one initial `GET /api/timers`, `timer:update` Socket.IO events, and a local one-second countdown tick.

Tasmota relay modes (`buttonMode`), button actions and required device settings
are in `docs/tasmota-setup.md`.

## Verification

```bash
cd nestjs
npm test

cd ../frontend
npx tsc --noEmit
npm test
npm run build
```

Manual MQTT smoke test:

```bash
mosquitto_sub -h localhost -t 'devices/+/state' -v
mosquitto_pub -h localhost -t 'devices/light1/cmd' -m '{"on": true}'
```
