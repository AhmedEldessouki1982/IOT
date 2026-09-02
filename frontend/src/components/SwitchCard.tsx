import { useHomeStore } from "../store/useHomeStore";
import { Power } from "lucide-react";

/**
 * Dedicated on/off switch CARD for a single live MQTT relay (a Sonoff T3US3C
 * POWER channel, surfaced as `sonoff1/2/3`). Bigger than a compact device row
 * so three of them read as balanced physical buttons laid out in one row.
 *
 * State is bound to useHomeStore's live device map, so it reflects both user
 * clicks and real physical button presses echoed back over MQTT/WebSocket.
 * Reuse: drop one in any room for a live light / relay device id.
 */
export default function SwitchCard({ deviceId, label }: { deviceId: string; label: string }) {
  const on = useHomeStore((s) => s.devices[deviceId]?.state.on === true);
  const toggle = useHomeStore((s) => s.toggle);
  const online = useHomeStore((s) => s.online);

  const handleClick = () => void toggle(deviceId);

  return (
    <div className="switch-card" data-on={on ? "true" : "false"}>
      <span className="switch-card-icon" data-on={on ? "true" : "false"} aria-hidden="true">
        <Power size={15} strokeWidth={1.8} />
      </span>
      <span className="switch-card-label">{label}</span>
      <button
        type="button"
        className="switch-card-toggle toggle"
        data-on={on ? "true" : "false"}
        aria-pressed={on}
        aria-label={`${label}: ${on ? "on" : "off"}`}
        onClick={handleClick}
        disabled={!online}
      >
        <span className="toggle-knob" />
      </button>
      <span className="cc-live-dot--sm" data-live={online ? "true" : "false"} aria-hidden="true" />
    </div>
  );
}
