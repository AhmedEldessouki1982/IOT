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

### Master Toilet (implemented)

The same routine and the same button behaviour as the main toilet — only the
registry entry and the `roomId` differ.

| Gang | Role        | Click cycle       |
| ---- | ----------- | ----------------- |
| 1    | LED profile | 10 m → 30 m → off |
| 2    | Spotlights  | 10 m → 30 m → off |
| 3    | Exhaust fan | 10 m → off        |

Registry entry (`.env`):

```json
{ "switchId": "toilet-master", "base": "MasterRoomToilet", "gangs": 3, "roomType": "toilet", "roomId": "toilet-master", "buttonMode": "local" }
```

Device ids are `toilet-master-g1..3`; the Tasmota `Topic` is `MasterRoomToilet`
and its `MqttHost` is the broker's LAN IP. On the device that means the same
T3US3C template and settings as the main toilet (`SetOption73 0`, `PowerRetain
1`, `PowerOnState 3`, `SetOption1 1`, `SetOption32 40`).

In the dashboard the master toilet is a **nested card** inside the Master Suite:
`frontend/src/dashboard/rooms.ts` declares it under the `master` room's
`nested` array, and the suite renders it by reusing `RoomCard`/`RoomDetail` one
level in. `routineId` must equal the registry `roomId` — the room card passes it
to `GET /api/rooms/<routineId>`, and for the main toilet the two are both
`"toilet"`.

### Master Bedroom (implemented)

A third T3US3C in the master bedroom (`10.10.0.245`, Tasmota `Topic` /
`DeviceName` `masterRoom`). This one has **no routine**: the gangs are plain
on/off lights, toggled from the wall buttons or from the app, with no click cycle
and no auto-off timer.

| Gang | Tasmota friendly name | Dashboard label | Behaviour |
| ---- | --------------------- | --------------- | --------- |
| 1    | `ledProfile`          | LED Profile     | on / off  |
| 2    | `spotlight`           | Spotlight       | on / off  |
| 3    | `roomUtility`         | Room Utility    | on / off  |

Registry entry (`.env`):

```json
{ "switchId": "masterRoom", "base": "masterRoom", "gangs": 3, "roomType": "none", "roomId": "masterRoom", "buttonMode": "local" }
```

Device ids are `masterRoom-g1..3`. `roomType: "none"` is what makes it plain:
`SonoffRegistryService.getRoomTypeForDevice` returns `null`, so
`DeviceAutomationService` never arms a timer for it — a wall touch
(`handleLocalRelayOn`) and a dashboard press (`handleButtonPress`) both leave it
alone. It stays `buttonMode: "local"` so the wall keeps working offline, exactly
like the toilets, only without the supervisor.

The device settings are the same T3US3C recipe (`SetOption73 0`, `PowerRetain
1`, `PowerOnState 3`, `SetOption1 1`, `SetOption32 40`, `SetOption19 1`).

In the dashboard the three gangs sit in the Master Suite's own switch row
(`frontend/src/dashboard/rooms.ts`, room `master`) — no `routineId`, so
`RoutinePanel` renders the plain live switch cards. The suite's placeholder
dummy light `light7` was removed in favour of these real relays.

> Note: manual switches share the `<switchId>-g<n>` id shape with routine gangs,
> so the id alone cannot tell a routine press from a plain toggle. The room
> config decides: `SwitchCard` receives `routine` explicitly from
> `RoutinePanel` (`routine={Boolean(roomId)}`), and only a room with a
> `routineId` advances a backend stage.

### Girl Room (implemented)

A fourth T3US3C, in the girl's bedroom (`10.10.0.184`, Tasmota `Topic` /
`DeviceName` `girlRoom`), provisioned with the same recipe as the master
bedroom switch and likewise **manual only** — no routine, no auto-off timer.

| Gang | Tasmota friendly name | Dashboard label | Behaviour |
| ---- | --------------------- | --------------- | --------- |
| 1    | `ledProfile`          | LED Profile     | on / off  |
| 2    | `spotlight`           | Spotlight       | on / off  |
| 3    | `roomUtility`         | Room Utility    | on / off  |

Registry entry (`.env`):

```json
{ "switchId": "girlRoom", "base": "girlRoom", "gangs": 3, "roomType": "none", "roomId": "girlRoom", "buttonMode": "local" }
```

Device ids are `girlRoom-g1..3`. In the dashboard they live on their own
top-level **Girl Room** card in `frontend/src/dashboard/rooms.ts`, placed
straight after the Master Suite; the card icon is lucide's `Venus` glyph (♀),
since lucide ships no literal "Girl" icon.

Everything said about the master bedroom switch applies verbatim here:
`roomType: "none"` makes `getRoomTypeForDevice` return `null` so nothing is ever
scheduled (neither `handleLocalRelayOn` nor `handleButtonPress` acts on it),
`buttonMode: "local"` keeps the wall working while the backend or broker is
down, and the explicit `routine={Boolean(roomId)}` flag keeps an app press off
the routine endpoint even though the ids end in `-g<n>`.

The two placeholder bedroom cards (`bed1` "Small Bedroom" and `bed2`
"Bedroom 2", dummy lights `light5`/`light6`) were removed in favour of this real
switch, and their ids were dropped from the Away scene.

### Omar Room (implemented)

A fifth T3US3C, in Omar's bedroom (`10.10.0.127`, Tasmota `Topic` / `DeviceName`
`omarRoom`), provisioned with the same recipe as the girl's bedroom switch and
likewise **manual only** — no routine, no auto-off timer.

| Gang | Tasmota friendly name | Dashboard label | Behaviour |
| ---- | --------------------- | --------------- | --------- |
| 1    | `ledProfile`          | LED Profile     | on / off  |
| 2    | `spotlight`           | Spotlight       | on / off  |
| 3    | `roomUtility`         | Room Utility    | on / off  |

Registry entry (`.env`):

```json
{ "switchId": "omarRoom", "base": "omarRoom", "gangs": 3, "roomType": "none", "roomId": "omarRoom", "buttonMode": "local" }
```

Device ids are `omarRoom-g1..3`, on their own top-level **Omar Room** card in
`frontend/src/dashboard/rooms.ts`, placed straight after the Girl Room; the card
icon is lucide's `Mars` glyph (♂), the counterpart to the Girl Room's `Venus`.

This unit arrived as stock firmware on a single-relay module (`Module 1`,
"Sonoff Basic"), so provisioning started by applying the template:

```text
Template {"NAME":"TX T3US3C","GPIO":[17,255,0,255,23,22,18,19,21,158,0,0,0],"FLAG":0,"BASE":30}
Module 0
```

Everything said about the master and girl bedroom switches applies verbatim
here: `roomType: "none"` makes `getRoomTypeForDevice` return `null` so nothing is
ever scheduled (neither `handleLocalRelayOn` nor `handleButtonPress` acts on it),
`buttonMode: "local"` keeps the wall working while the backend or broker is down,
and the explicit `routine={Boolean(roomId)}` flag keeps an app press off the
routine endpoint even though the ids end in `-g<n>`.

## Provisioning traps (lessons learned)

The things that actually cost time when standing up a new T3US3C, in the order
they bite. They are kept here (versioned with the project) as well as in the
`sonoff-tasmota-flash` skill, which lives outside this repo.

**1. "Flashed" is not "configured", and a stock unit is a single-relay module.**
A fresh unit can be flashed, joined to WiFi and answering `Status 0` while still
being `Module 1` ("Sonoff Basic") with `DeviceName "Tasmota"`,
`Topic tasmota_<MAC6>` and an empty `MqttHost`. The quickest tell is the relay
count: `Power1` answers while `Power2`/`Power3` return
`{"Command":"Error"}`. Read `Module`, `Topic` and `MqttHost` before assuming
anything — this is exactly how the Omar Room unit (`10.10.0.127`) arrived.

**2. Applying the template is part of provisioning.** The template comes from the
Tasmota repository (Blakadder) at
`templates.blakadder.com/sonoff_TX-T3US3C.html` — note the `sonoff_TX-T3...` URL
form; `TX_T3US3C.html` 404s. That page serves the **old 13-slot** JSON, which
Tasmota converts on apply into the 14-slot form (`[32,1,0,1,226,225,33,34,224,
576,0,0,0,0]`), so both describe the same GPIO map and neither is "wrong":

```text
Template {"NAME":"TX T3US3C","GPIO":[17,255,0,255,23,22,18,19,21,158,0,0,0],"FLAG":0,"BASE":30}
Module 0
```

`Module 0` restarts the device; the three relays appear afterwards.

**3. `Module`, `MqttHost` and `Hostname` are restart boundaries.** A settings
batch sent in the same breath as one of them is silently lost — `Backlog`
answers `{}` even when nothing applied. Write the restarting setting on its own,
poll `Status 2`/`Status 11` until the device answers, then send the next batch,
and re-read every setting from its own echo.

**4. Empty read-backs right after a batch mean "it rebooted", not "the write
failed".** Changing `DeviceName`/`Topic` (and `SetOption19`) also restarts the
network stack, so immediate read-backs come back blank — wait for ping to answer
first. `SetOption19 1` in particular only stuck when written on its own, apart
from the identity/options batch.

**5. A new registry entry only reaches the app after a backend restart.** Adding
a switch to `SONOFF_SWITCHES_JSON` does nothing until the NestJS backend is
restarted; confirm it took by looking for
`Subscribed to devices/<switchId>-g<n>/cmd` in the backend log.

**6. Restarting that backend without killing your own shell.** `pkill -f "node
dist/main.js"` matches the *calling shell's* own command line (it contains the
same string) and kills the session. Filter on the process name instead:

```bash
ps -eo pid,args | awk '/dist\/main\.js/ && $2=="node" {print $1}' | xargs -r kill
```

**7. A further identical switch is pure data.** Once a room exists as a plain
manual room, the next one needs no new code: one registry entry
(`roomType: "none"`, `buttonMode: "local"`), one room config, its ids added to
`LIVE_DEVICE_IDS` and `SONOFF_DEVICE_IDS`, its gangs added to the Away scene
(the scene test requires every scene id to exist in `rooms.ts`), and an icon in
`RoomCard.tsx`.


