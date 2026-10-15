export function timerFraction(remaining, total) {
  return total > 0 && Number.isFinite(total) ? Math.min(1, Math.max(0, remaining / total)) : 0;
}
