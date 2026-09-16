import { Bell, BellRing } from "lucide-react";

export interface SmokeDeviceProps {
  variant: "card";
  label: string;
  /** Sensor alarm state: false = armed/dormant, true = triggered. */
  state?: boolean;
  onToggle?: (active: boolean) => void;
  badge?: "live" | "demo";
}

/** Smoke sensor — an armed/dormant status pill that turns into a red alarm
 *  pill when triggered. Toggling flips the alarm state (demo wiring). */
export default function SmokeDevice({ label, state, onToggle, badge }: SmokeDeviceProps) {
  const active = state ?? false;

  return (
    <div className="device-row smoke-row" data-state={active ? "alarm" : "safe"}>
      <div className="device-info">
        <span className="device-icon" data-on={String(!active)}>
          {active ? <BellRing size={15} strokeWidth={1.8} /> : <Bell size={15} strokeWidth={1.4} />}
        </span>
        <span className="device-label">{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {badge && <span className="cc-live-dot--sm" data-live={badge === "live" ? "true" : "false"} />}
        <button
          type="button"
          className="lock-pill"
          onClick={() => onToggle?.(!active)}
          data-locked={!active}
          aria-pressed={active}
          aria-label={`${label}: ${active ? "alarm on" : "armed"}`}
        >
          {active ? "Alarm" : "Armed"}
        </button>
      </div>
    </div>
  );
}