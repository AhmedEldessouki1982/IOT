import { motion } from "framer-motion";
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
  return (
    <motion.button
      type="button"
      className="shutdown-btn"
      data-active={active}
      onClick={onShutdown}
      whileTap={{ scale: 0.94 }}
      aria-label={label}
      title={`${label} — all lights off, all doors locked`}
    >
      <Power size={14} strokeWidth={2} />
      <span>{active ? "Shut down" : label}</span>
    </motion.button>
  );
}
