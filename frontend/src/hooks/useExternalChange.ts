import { useEffect, useRef, useState } from "react";
import { isExternalChange } from "./motionRules.js";
import { lastLocalAction, subscribeSceneFlash } from "./localActions";

export function useExternalChange(key: string, value: unknown) {
  const previous = useRef({ key, value });
  const [flash, setFlash] = useState({ revision: 0, delay: 0, external: false });
  useEffect(() => {
    if (previous.current.key === key && isExternalChange(previous.current.value, value, lastLocalAction(key), Date.now())) {
      setFlash(f => ({ revision: f.revision + 1, delay: 0, external: true }));
    }
    previous.current = { key, value };
  }, [key, value]);
  useEffect(() => subscribeSceneFlash((deviceKey, delay) => {
    if (deviceKey === key) setFlash(f => ({ revision: f.revision + 1, delay, external: false }));
  }), [key]);
  return flash;
}
