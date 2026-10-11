import { formatDuration } from "../lib/format";

export default function TimerBadge({ seconds }: { seconds: number }) {
  if (!seconds || seconds <= 0) return null;
  const isLow = seconds < 60;
  return (
    <span className={`timer-badge${isLow ? " timer-badge--low" : ""}`}>
      {formatDuration(seconds)}
    </span>
  );
}
