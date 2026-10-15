export const LOCAL_ACTION_WINDOW_MS = 1500;
export function valueChanged(previous, next) {
  return previous !== undefined && next !== undefined && !Object.is(previous, next);
}
export function isExternalChange(previous, next, lastLocal, now) {
  return valueChanged(previous, next) && (lastLocal === undefined || now - lastLocal > LOCAL_ACTION_WINDOW_MS);
}
export function animatedInteger(from, to, elapsed, duration, reduced = false) {
  if (reduced || duration <= 0) return Math.round(to);
  const progress = Math.min(1, Math.max(0, elapsed / duration));
  return Math.round(from + (to - from) * (1 - (1 - progress) ** 3));
}
export function staggerDelay(index, step, reduced = false) {
  return reduced ? 0 : Math.min(Math.max(0, index), 7) * step;
}
