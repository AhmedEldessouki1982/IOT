import { useEffect, useRef, useState } from "react";
import { Power } from "lucide-react";
import { useLongPress } from "../hooks/useLongPress";
import { motionMs } from "../hooks/motionTokens";

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
  const [holding, setHolding] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const press = useLongPress(() => {}, () => { setHolding(false); onShutdown(); }, motionMs("hold"));
  useEffect(() => { if (confirming) dialog.current?.showModal(); }, [confirming]);
  return (
    <div className="shutdown-action">
      <button
        type="button"
        className="shutdown-btn"
        data-active={active}
        {...press}
        data-holding={holding}
        onPointerDown={(event) => { if (event.button !== 0 || !event.isPrimary) return; setHolding(true); press.onPointerDown(event); }}
        onPointerUp={(event) => { setHolding(false); press.onPointerUp(event); }}
        onPointerLeave={(event) => { setHolding(false); press.onPointerLeave(event); }}
        onPointerCancel={(event) => { setHolding(false); press.onPointerCancel(event); }}
        onClick={(event) => { if (event.detail === 0) setConfirming(true); }}
        aria-label={label}
        title="Hold to shut down: lights off, doors locked"
      >
        <span className="hold-indicator"><Power size={18} strokeWidth={2} /><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" pathLength="100" /></svg></span>
        <span>{label}</span>
      </button>
      {confirming && <dialog ref={dialog} className="shutdown-confirm shutdown-dialog" aria-label="Confirm shut down" onClose={() => setConfirming(false)}>
        <span>Turn off lights and lock doors?</span>
        <button type="button" autoFocus onClick={() => setConfirming(false)}>Cancel</button>
        <button type="button" className="shutdown-confirm-primary" onClick={() => { setConfirming(false); onShutdown(); }}>Shut down</button>
      </dialog>}
    </div>
  );
}
