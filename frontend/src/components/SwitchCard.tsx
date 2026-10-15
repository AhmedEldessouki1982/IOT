import { useHomeStore } from "../store/useHomeStore";
import { Power } from "lucide-react";
import { apiPost } from "../lib/api";
import { useLongPress } from "../hooks/useLongPress";
import TimerBadge from "./TimerBadge";
import DeviceConnection from "./DeviceConnection";
import DeviceMotion from "./DeviceMotion";

function timerGangForDeviceId(deviceId: string): number | null {
  const match = /-g([1-3])$/.exec(deviceId);
  return match ? Number(match[1]) : null;
}

/**
 * Dedicated on/off switch CARD for a single live MQTT relay (a Sonoff T3US3C
 * POWER channel, surfaced as `sonoff1/2/3`). Bigger than a compact device row
 * so three of them read as balanced physical buttons laid out in one row.
 *
 * State is bound to useHomeStore's live device map, so it reflects both user
 * clicks and real physical button presses echoed back over MQTT/WebSocket.
 * Reuse: drop one in any room for a live light / relay device id.
 */
export default function SwitchCard({
  deviceId,
  label,
  remainingSeconds,
}: {
  deviceId: string;
  label: string;
  remainingSeconds?: number;
}) {
  const state = useHomeStore((s) => s.devices[deviceId]?.state.on);
  const on = state === true;
  const toggle = useHomeStore((s) => s.toggle);
  const setBoolean = useHomeStore((s) => s.setBoolean);
  const online = useHomeStore((s) => s.online);
  const timerGang = timerGangForDeviceId(deviceId);
  const usesTimerGesture = timerGang !== null;

  const manualOff = () => void setBoolean(deviceId, "on", false);
  const toggleLegacy = () => void toggle(deviceId);
  const pressButton = (pressType: "single" | "long") => {
    if (!usesTimerGesture || !timerGang) {
      toggleLegacy();
      return;
    }
    if (on) {
      manualOff();
      return;
    }
    void apiPost(`/api/devices/${deviceId}/button`, {
      gang: timerGang,
      pressType,
    }).catch(() => {});
  };
  const press = useLongPress(
    () => pressButton("single"),
    () => pressButton("long"),
  );

  return (
    <DeviceMotion deviceKey={deviceId} label={label} kind="light" value={typeof state === "boolean" ? state : undefined}>
    <div className="switch-card" data-on={on ? "true" : "false"}>
      <span
        className="switch-card-icon"
        data-on={on ? "true" : "false"}
        aria-hidden="true"
      >
        <Power size={15} strokeWidth={1.8} />
      </span>
      <span className="switch-card-label">{label}</span>
      {remainingSeconds !== undefined && (
        <TimerBadge seconds={remainingSeconds} />
      )}
      <button
        type="button"
        className="switch-card-toggle toggle"
        data-on={on ? "true" : "false"}
        role="switch"
        aria-checked={on}
        aria-label={`${label}: ${on ? "on" : "off"}`}
        {...press}
        onClick={(event) => {
          if (event.detail === 0) pressButton("single");
        }}
        disabled={!online}
      >
        <span className="toggle-knob" />
      </button>
      <DeviceConnection deviceId={deviceId} />
    </div>
    </DeviceMotion>
  );
}
