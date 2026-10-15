import LockIcon from "../../../components/LockIcon";

export interface LockDeviceProps {
  variant: "card";
  label: string;
  state?: boolean;
  onToggle?: (locked: boolean) => void;
  badge?: "live" | "demo";
}

/** Door lock — a secure/insecure pill rather than a plain switch; locks
 *  carry more weight than a light, so the affordance reads as a deliberate
 *  action (icon + word) instead of a flippable toggle. */
export default function LockDevice({
  label,
  state,
  onToggle,
  badge,
}: LockDeviceProps) {
  const locked = state ?? true;

  return (
    <div className="device-row lock-row">
      <div className="device-info">
        <span className="device-icon" data-locked={locked}>
          <LockIcon locked={locked} />
        </span>
        <span className="device-label">{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {badge && (
          <span
            className="cc-live-dot--sm"
            data-live={badge === "live" ? "true" : "false"}
          />
        )}
        <button
          type="button"
          onClick={() => onToggle?.(!locked)}
          data-locked={locked}
          aria-pressed={locked}
          aria-label={`${label}: ${locked ? "locked" : "unlocked"}`}
          className="lock-pill"
        >
          <span className="lock-labels"><span aria-hidden={!locked} className="lock-label-locked">Locked</span><span aria-hidden={locked} className="lock-label-unlocked">Unlocked</span></span>
        </button>
      </div>
    </div>
  );
}
