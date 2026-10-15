import { useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { motionMs, motionEase } from "../hooks/motionTokens";
import { timerFraction } from "../hooks/timerVisual.js";

const firstRemaining = new Map<string, number>();
export default function TimerBadge({ seconds, durationSeconds, expiresAt, deviceId = "" }: {
  seconds: number; durationSeconds?: number; expiresAt?: string; deviceId?: string;
}) {
  const initial = useRef(seconds);
  const key = `${deviceId}/${expiresAt ?? ""}`;
  if (expiresAt && seconds > 0 && !firstRemaining.has(key)) {
    firstRemaining.set(key, seconds);
    if (firstRemaining.size > 200) firstRemaining.delete(firstRemaining.keys().next().value!);
  }
  const total = durationSeconds ?? (expiresAt ? firstRemaining.get(key) : initial.current) ?? seconds;
  const reduced = useReducedMotion();
  const text = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.max(0, seconds % 60).toString().padStart(2, "0")}`;
  return <AnimatePresence initial={false}>{seconds > 0 && <motion.span
    key={key} className={`timer-badge${seconds <= 60 ? " timer-badge--low" : ""}`}
    initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: reduced ? 0 : motionMs("state") / 1000, ease: motionEase() }}
    aria-label={`Turns off in ${text}`}>
    <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
      <circle className="timer-ring-track" cx="16" cy="16" r="12" />
      <circle className="timer-ring-value" cx="16" cy="16" r="12" pathLength="100" strokeDasharray="100" strokeDashoffset={100 * (1 - timerFraction(seconds, total))} />
    </svg><span className="timer-numerals">{text}</span>
  </motion.span>}</AnimatePresence>;
}
