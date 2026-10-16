# Tasmota Setup Notes

These notes are for Sonoff T3US3C wall switches flashed with Tasmota and used
through the backend's shared MQTT connection.

## MQTT Topic Shape

The backend expects each switch registry entry to provide the Tasmota topic
base used in:

- `stat/<base>/POWER<n>` for relay state (`ON` / `OFF`)
- `cmnd/<base>/POWER<n>` for relay commands (`ON` / `OFF`)
- `stat/<base>/RESULT` for button actions

## Button Actions

Tasmota documents button action payloads on the RESULT topic when button action
publishing is enabled, for example:

```json
{ "Button1": { "Action": "SINGLE" } }
```

and hold actions as:

```json
{ "Button1": { "Action": "HOLD" } }
```

Both actions count as **one press** in the backend — a press advances the gang
one stage regardless of whether it arrived as `SINGLE` or `HOLD`:

- `SINGLE` -> `single`
- `HOLD` -> `long`

Required Tasmota setting:

```text
SetOption73 1
```

This detaches button actions from direct relay control and publishes button
events over MQTT. Tasmota's hold threshold is configurable with `SetOption32`
(currently `40`, i.e. 4.0 s). Because `HOLD` only advances one stage, holding
the button briefly is enough — there is no separate long-press action to wait for.

Because buttons are detached, **relay control depends on the backend being up**:
the switch publishes an action, the backend advances the routine stage and
publishes `cmnd/<base>/POWER<n>`. If the broker/backend are down, a touch does
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
`roomType: "toilet"` and its own `roomId` — no new code.

### Main Toilet (implemented)

| Gang | Role        | Click cycle        |
| ---- | ----------- | ------------------ |
| 1    | LED profile | 10 m → 30 m → off  |
| 2    | Spotlights  | 10 m → 30 m → off  |
| 3    | Exhaust fan | 10 m → off         |

Registry entry (`.env`):

```json
{ "switchId": "toilet-main", "base": "mainToilet", "gangs": 3, "roomType": "toilet", "roomId": "toilet" }
```

Device ids are `toilet-main-g1..3`. The switch's Tasmota `Topic` is `mainToilet`
and its `MqttHost` is the broker's LAN IP.

## Optional Device-Side Exhaust Timer

For the fixed 10-minute exhaust fan behavior, Tasmota's on-device `PulseTime`
can be considered as a fallback or alternative. The benefit is that the relay
can still turn itself off if the server, WiFi, or broker is unavailable.

Caveat: `PulseTime` self-cuts the relay out of band. The backend's cycle treats
that as an ordinary off, so the next click starts a fresh 10 min stage — but the
fan will drop off at PulseTime even if the backend just re-armed its own timer.
Use `PulseTime` **or** the backend cycle, not both.

TODO(verify): confirm the exact `PulseTime` value encoding for a 10-minute
timeout on the target Tasmota firmware before documenting a command.
