import { useState } from "react";
import { Power } from "lucide-react";

interface EmergencyShutdownProps {
  /** Toggles the shutdown state. */
  onShutdown: () => void;
  /** True while a shutdown is armed/applied, to reflect state on the button. */
  active?: boolean;
  label?: string;
}

/**
 * Emergency shutdown — a deliberately offset, high-contrast button (power
 * icon + word) that turns everything off with one tap. Distinct from the
 * theme toggle so it reads as a heavier, destructive action. Reusable: the
 * caller decides what "all off" means for its device set.
 */
export default function EmergencyShutdown({
  onShutdown,
  active = false,
  label = "Shutdown",
}: EmergencyShutdownProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="shutdown-action">
      <button
        type="button"
        className="shutdown-btn"
        data-active={active}
        onClick={() => setConfirming(true)}
        aria-label={label}
        title={`${label} — all lights off, all doors locked`}
      >
        <Power size={18} strokeWidth={2} />
        <span>{label}</span>
      </button>
      {confirming && <div className="shutdown-confirm" role="group" aria-label="Confirm shut down">
        <span>Turn off lights and lock doors?</span>
        <button type="button" onClick={() => setConfirming(false)}>Cancel</button>
        <button type="button" className="shutdown-confirm-primary" onClick={() => { setConfirming(false); onShutdown(); }}>Shut down</button>
      </div>}
    </div>
  );
}
