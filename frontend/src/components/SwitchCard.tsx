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
  hint,
  remainingSeconds,
  durationSeconds,
  expiresAt,
  onPress,
  routine,
}: {
  deviceId: string;
  label: string;
  /** Optional role hint under the label, e.g. "10m → 30m → off". */
  hint?: string;
  remainingSeconds?: number;
  durationSeconds?: number;
  expiresAt?: string;
  /**
   * Optional press override (routine mode): called on every press/tap instead of
   * the built-in legacy button call. Lets the room-routine layer own routing
   * (each press advances one cycle stage) while this card keeps the exact same
   * look and gesture handling. The `pressType` argument tells the override
   * whether it was a tap or a long press; routine cards treat both as one click.
   */
  onPress?: (pressType: "single" | "long") => void;
  /**
   * Whether a press advances the backend routine stage (routine room) instead of
   * plainly toggling the relay. Callers that know the room render in routine
   * mode pass this explicitly; when omitted we fall back to the "-g<n>" id
   * heuristic for backwards compatibility.
   *
   * This matters because manual switches share the `<switchId>-g<n>` id shape
   * with routine gangs (registry roomType "none"), so the id alone cannot tell
   * a routine press from a plain toggle.
   */
  routine?: boolean;
}) {
  const state = useHomeStore((s) => s.devices[deviceId]?.state.on);
  const on = state === true;
  const toggle = useHomeStore((s) => s.toggle);
  const setBoolean = useHomeStore((s) => s.setBoolean);
  const online = useHomeStore((s) => s.online);
  const timerGang = timerGangForDeviceId(deviceId);
  const usesTimerGesture = routine ?? timerGang !== null;

  const manualOff = () => void setBoolean(deviceId, "on", false);
  const toggleLegacy = () => void toggle(deviceId);
  const defaultPressButton = (pressType: "single" | "long") => {
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
  const pressButton = onPress ?? defaultPressButton;
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
      {hint ? (
        <span className="switch-card-text">
          <span className="switch-card-label">{label}</span>
          <span className="switch-card-hint">{hint}</span>
        </span>
      ) : (
        <span className="switch-card-label">{label}</span>
      )}
      <TimerBadge seconds={remainingSeconds ?? 0} durationSeconds={durationSeconds} expiresAt={expiresAt} deviceId={deviceId} />
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
