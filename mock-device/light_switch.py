"""Mock smart light device: subscribes to JSON commands, publishes JSON state.

Command contract (payload on devices/<id>/cmd is a JSON object):
    {"on": true}   -> turn the light on
    {"on": false}  -> turn the light off

State contract (payload on devices/<id>/state is a DeviceState JSON object):
    {"deviceId": "light1", "type": "switch", "state": {"on": true},
     "timestamp": "<ISO-8601>"}
"""

import json
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

DEVICE_ID = "light1"
BROKER = "localhost"
PORT = 1883
CMD_TOPIC = f"devices/{DEVICE_ID}/cmd"
STATE_TOPIC = f"devices/{DEVICE_ID}/state"
ACTUATOR_DELAY = 0.3  # seconds, simulate actuator delay


def publish_state(client: mqtt.Client, on: bool) -> None:
    payload = {
        "deviceId": DEVICE_ID,
        "type": "switch",
        "state": {"on": on},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    client.publish(STATE_TOPIC, json.dumps(payload))
    print(f"[publish] {STATE_TOPIC}: {payload}")


def on_connect(client: mqtt.Client, userdata, flags, rc, properties=None) -> None:
    print(f"Connected to broker {BROKER}:{PORT} (rc={rc})")
    client.subscribe(CMD_TOPIC)
    print(f"Subscribed to {CMD_TOPIC}")
    publish_state(client, False)


def on_message(client: mqtt.Client, userdata, msg) -> None:
    try:
        cmd = json.loads(msg.payload.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        print(f"Ignoring non-JSON command: {msg.payload!r}")
        return
    print(f"[command] {msg.topic}: {cmd}")
    if (
        not isinstance(cmd, dict)
        or "on" not in cmd
        or cmd["on"] not in (True, False)
    ):
        print(f"Ignoring unknown command: {cmd!r}")
        return
    time.sleep(ACTUATOR_DELAY)
    publish_state(client, bool(cmd["on"]))


def main() -> None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(BROKER, PORT, 60)
    client.loop_forever()


if __name__ == "__main__":
    main()