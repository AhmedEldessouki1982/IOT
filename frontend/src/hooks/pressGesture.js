export const DEFAULT_LONG_PRESS_MS = 600;

export function resolvePressGesture(
  elapsedMs,
  thresholdMs = DEFAULT_LONG_PRESS_MS,
) {
  return elapsedMs >= thresholdMs ? "long" : "short";
}
