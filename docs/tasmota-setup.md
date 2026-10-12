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

The backend maps:

- `SINGLE` -> `single`
- `HOLD` -> `long`

Required Tasmota setting:

```text
SetOption73 1
```

This detaches button actions from direct relay control and publishes button
events over MQTT. Tasmota's hold threshold is configurable with `SetOption32`.

## Optional Device-Side Exhaust Timer

For the fixed 10-minute exhaust fan behavior, Tasmota's on-device `PulseTime`
can be considered as a fallback or alternative. The benefit is that the relay
can still turn itself off if the server, WiFi, or broker is unavailable.

TODO(verify): confirm the exact `PulseTime` value encoding for a 10-minute
timeout on the target Tasmota firmware before documenting a command.
