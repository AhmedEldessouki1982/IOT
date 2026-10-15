import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { animatedInteger } from "./motionRules.js";

export function useAnimatedNumber(value: number, ms: number) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    const from = current.current;
    if (reduced || ms <= 0 || from === value) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      current.current = animatedInteger(from, value, now - start, ms);
      setDisplay(current.current);
      if (now - start < ms) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, ms, reduced]);
  return reduced || ms <= 0 ? value : display;
}
