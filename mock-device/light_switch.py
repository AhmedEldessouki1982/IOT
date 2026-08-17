"""Mock smart light device: subscribes to commands, publishes JSON state."""

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


def publish_state(client: mqtt.Client, state: str) -> None:
    payload = {
        "deviceId": DEVICE_ID,
        "state": state,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    client.publish(STATE_TOPIC, json.dumps(payload))
    print(f"[publish] {STATE_TOPIC}: {payload}")


def on_connect(client: mqtt.Client, userdata, flags, rc, properties=None) -> None:
    print(f"Connected to broker {BROKER}:{PORT} (rc={rc})")
    client.subscribe(CMD_TOPIC)
    print(f"Subscribed to {CMD_TOPIC}")
    publish_state(client, "off")


def on_message(client: mqtt.Client, userdata, msg) -> None:
    cmd = msg.payload.decode().strip()
    if cmd.startswith('"'):
        try:
            cmd = json.loads(cmd)
        except json.JSONDecodeError:
            pass
    print(f"[command] {msg.topic}: {cmd}")
    if cmd not in ("on", "off"):
        print(f"Ignoring unknown command: {cmd!r}")
        return
    time.sleep(ACTUATOR_DELAY)
    publish_state(client, cmd)


def main() -> None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(BROKER, PORT, 60)
    client.loop_forever()


if __name__ == "__main__":
    main()