# Tasmota Setup Notes

These notes are for Sonoff T3US3C wall switches flashed with Tasmota and used
through the backend's shared MQTT connection.

## MQTT Topic Shape

The backend expects each switch registry entry to provide the Tasmota topic
base used in:

- `stat/<base>/POWER<n>` for relay state (`ON` / `OFF`)
- `cmnd/<base>/POWER<n>` for relay commands (`ON` / `OFF`)
- `stat/<base>/RESULT` for button actions (detached switches only)

## Relay Control Modes

Each registry entry declares how its wall buttons are wired, with `buttonMode`:

| `buttonMode`                                  | Tasmota           | A wall touch …                                                                                                |
| --------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `local` (use it for rooms that have a routine) | `SetOption73 0`   | switches its own relay on the device; the backend sees `stat/<base>/POWER<n>` and adds the timer               |
| `detached` (the default)                       | `SetOption73 1`   | publishes a `Button<n>` action and the backend drives the relay                                                |

`local` is what makes the wall switch survive an outage: the relay is switched
by the device itself, so a touch still works when the backend, the broker or the
network is down. The backend becomes a supervisor instead of a dependency:

- a physical **on** gets the gang's first stage as an auto-off (10 min on the
  toilet), so a forgotten light still goes out while the backend is online;
- a physical **off** cancels that timer.

A `local` wall touch is a plain on/off, not the dashboard's click cycle: the
device has no notion of stages. The staged 10 → 30 → off cycle stays available
on the dashboard card, which the backend drives directly. While the backend is
unreachable a touch keeps working as a plain on/off, just without a timer, and
any timer that expired in the meantime fires as soon as it is back.

`detached` switches have no such fallback: with the backend down a touch does
nothing. Use them only when backend-driven behaviour matters more than offline
operation. Reception is deliberately left `detached`.

The mode is set per switch, so one switch can be `local` while another stays
`detached`.

### Required Device Settings

| Setting        | Value                                 | Why                                                                                        |
| -------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `SetOption73`  | `0` for `local`, `1` for `detached`   | whether a button drives its own relay                                                      |
| `PowerRetain`  | `1`                                   | the broker keeps the last `POWER` state, so the backend resyncs from the device on (re)connect |
| `PowerOnState` | `3`                                   | after a power cut the relay returns to its previous state, with the backend out of the loop |

`PowerRetain 1` matters because a `local` switch can change state while the
backend is down: without a retained state the backend would restart on a stale
snapshot. The retained state is written by the device, so it always describes
the real relay.

## Button Actions (detached switches)

When buttons do not drive their relays, Tasmota publishes button actions on the
RESULT topic, for example:

```json
{ "Button1": { "Action": "SINGLE" } }
```

and hold actions as:

```json
{ "Button1": { "Action": "HOLD" } }
```

Both count as **one click** in the backend, and a click advances the gang one
stage. Tasmota's hold threshold is configurable with `SetOption32` (currently
`40`, i.e. 4.0 s). Because `HOLD` only advances one stage there is no separate
long-press action to wait for; `DOUBLE` and any other action are ignored.

Required Tasmota setting:

```text
SetOption73 1
```

Because buttons are detached, **relay control depends on the backend being up**:
the switch publishes an action, the backend advances the routine stage and
publishes `cmnd/<base>/POWER<n>`. If the broker or backend are down, a touch does
nothing.

## Rooms and Routines

Each registry entry maps a switch to a `roomType` (`toilet` | `bedroom` | `none`)
and a `roomId`. Rooms with a `roomType` get a **routine** from
`nestjs/src/routines/routine.config.ts` — the single source of truth for gang
roles and their click stages. The backend exposes it as:

- `GET /api/rooms` — every routine room with live state + running timers
- `GET /api/rooms/:roomId`
- `POST /api/rooms/:roomId/gangs/:gang/press` — advance one stage (body ignored)
- `DELETE /api/rooms/:roomId/gangs/:gang/timer`

Each room gang is served with `stages` (the ordered minutes), `hint`
(`10m → 30m → off`) and `stage` (the 1-based stage currently armed, or `null`).

Adding a second toilet (e.g. master) is one registry entry with the same
`roomType: "toilet"`, its own `roomId` and `buttonMode: "local"` — no new code.

### Main Toilet (implemented)

| Gang | Role        | Click cycle       |
| ---- | ----------- | ----------------- |
| 1    | LED profile | 10 m → 30 m → off |
| 2    | Spotlights  | 10 m → 30 m → off |
| 3    | Exhaust fan | 10 m → off        |

Registry entry (`.env`):

```json
{ "switchId": "toilet-main", "base": "mainToilet", "gangs": 3, "roomType": "toilet", "roomId": "toilet", "buttonMode": "local" }
```

Device ids are `toilet-main-g1..3`. The switch's Tasmota `Topic` is `mainToilet`
and its `MqttHost` is the broker's LAN IP.
