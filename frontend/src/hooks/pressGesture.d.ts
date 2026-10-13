export const DEFAULT_LONG_PRESS_MS: number;
export type PressGesture = "short" | "long";
export function resolvePressGesture(
  elapsedMs: number,
  thresholdMs?: number,
): PressGesture;
