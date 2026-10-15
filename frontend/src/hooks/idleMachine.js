export const DEFAULT_IDLE_MINUTES = 5;
export function idleTransition(state, event, enabled = true, activePointers = 0) {
  if (!enabled) return { state: "awake", consume: false };
  if (event === "timeout") return { state: state === "awake" ? "asleep" : state, consume: false };
  if (state === "awake") return { state, consume: false };
  if (state === "asleep") {
    return { state: ["click", "keyup", "pointercancel", "activity", "wheel"].includes(event) ? "awake" : "waking", consume: true };
  }
  return { state: activePointers === 0 && ["click", "keyup", "pointercancel"].includes(event) ? "awake" : "waking", consume: true };
}
