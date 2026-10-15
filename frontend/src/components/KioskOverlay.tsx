import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { motionMs, motionEase } from "../hooks/motionTokens";

const positions = [[0, 0], [6, -8], [-6, 8], [6, 8], [-6, -8]];
export default function KioskOverlay({ online, summary }: { online: boolean; summary: string }) {
  const [now, setNow] = useState(() => new Date());
  const [position, setPosition] = useState(0);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const timer = window.setInterval(() => { setNow(new Date()); setPosition(p => (p + 1) % positions.length); }, 60000);
    return () => { clearInterval(timer); focused?.focus(); };
  }, []);
  return <motion.div ref={ref} tabIndex={-1} className="kiosk-overlay" role="dialog" aria-modal="true" aria-label="Wall panel asleep. Touch or press a key to wake."
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: reduced ? 0 : motionMs("state") / 1000, ease: motionEase() } }}
    transition={{ duration: reduced ? 0 : motionMs("idle") / 1000, ease: motionEase() }}>
    <div className="kiosk-clock" style={{ "--drift-x": `${positions[position][0]}vw`, "--drift-y": `${positions[position][1]}vh` } as CSSProperties}>
      <time>{now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",hour12:false})}</time>
      <p>{now.toLocaleDateString([], {weekday:"long",month:"long",day:"numeric"})}</p>
      <p>{online ? "Hub connected" : "Hub offline"}</p>
      <p>{summary}</p>
    </div>
  </motion.div>;
}
