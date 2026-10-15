import { useContext, useEffect, useRef, useState } from "react";
import { MotionReadiness } from "./MotionReadiness";
import { valueChanged } from "./motionRules.js";

export function useStateChange(value: unknown) {
  const ready = useContext(MotionReadiness);
  value = ready ? value : undefined;
  const previous = useRef(value);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (valueChanged(previous.current, value)) setRevision(n => n + 1);
    previous.current = value;
  }, [value]);
  return revision;
}
