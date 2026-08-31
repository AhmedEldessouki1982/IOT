import { useState } from "react";

/**
 * Local-only boolean state for dummy (no-backend) devices — dummy lights
 * and door locks share this, since both are just an id → boolean map.
 * Lifted to the dashboard so all room cards and the room detail view stay
 * in sync. Each id carries its own starting value (a light defaults off,
 * a lock defaults locked) rather than one blanket default.
 */
export function useDummyToggles(initial: Record<string, boolean>) {
  const [states, setStates] = useState<Record<string, boolean>>(initial);
  const toggle = (id: string) =>
    setStates((prev) => ({ ...prev, [id]: !prev[id] }));
  /** Bulk-overwrite state — used by emergency shutdown (all off / locked). */
  const reset = (values: Record<string, boolean>) => setStates(values);
  return { states, toggle, reset };
}
