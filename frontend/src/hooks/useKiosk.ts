import { useEffect, useRef, useState } from "react";
import { DEFAULT_IDLE_MINUTES, idleTransition, type IdleState } from "./idleMachine.js";

const STORAGE_KEY = "iot.wallPanel";
function initialConfig() {
  let saved: { enabled?: boolean; minutes?: number } = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") ?? {}; } catch { /* Use local defaults if storage is unavailable. */ }
  return {
    enabled: new URLSearchParams(location.search).get("kiosk") === "1" || (saved.enabled ?? import.meta.env.VITE_KIOSK_DEFAULT === "true"),
    minutes: typeof saved.minutes === "number" && Number.isFinite(saved.minutes) ? Math.min(120, Math.max(0, Math.round(saved.minutes))) : DEFAULT_IDLE_MINUTES,
  };
}
export function useKiosk() {
  const [config, setConfig] = useState(initialConfig);
  const [state, setState] = useState<IdleState>("awake");
  const machine = useRef<IdleState>("awake");
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* In-memory settings still work. */ }
    machine.current = "awake";
    setState("awake");
    if (!config.enabled || !config.minutes) return;
    let timer: number;
    const activePointers = new Set<number>();
    const arm = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (activePointers.size || document.querySelector("dialog[open]")) { arm(); return; }
        const next = idleTransition(machine.current, "timeout");
        machine.current = next.state;
        setState(next.state);
      }, config.minutes * 60000);
    };
    const handle = (event: Event) => {
      if (event instanceof PointerEvent) {
        if (event.type === "pointerdown") activePointers.add(event.pointerId);
        if (event.type === "pointerup" || event.type === "pointercancel") activePointers.delete(event.pointerId);
      }
      const next = idleTransition(machine.current, event.type === "pointermove" ? "activity" : event.type, true, activePointers.size);
      machine.current = next.state;
      if (next.consume) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setState(next.state);
      }
      arm();
    };
    const events = ["pointerdown", "pointerup", "pointercancel", "pointermove", "mousedown", "mouseup", "click", "touchstart", "touchend", "keydown", "keyup", "wheel"];
    for (const event of events) window.addEventListener(event, handle, { capture: true, passive: false });
    arm();
    return () => { clearTimeout(timer); for (const event of events) window.removeEventListener(event, handle, true); };
  }, [config]);
  return {
    ...config, asleep: state === "asleep",
    setEnabled: (enabled: boolean) => {
      if (!enabled) { const url = new URL(location.href); url.searchParams.delete("kiosk"); history.replaceState(null, "", url); }
      setConfig(c => ({ ...c, enabled }));
    },
    setMinutes: (minutes: number) => { if (Number.isFinite(minutes)) setConfig(c => ({ ...c, minutes: Math.max(0, Math.min(120, Math.round(minutes))) })); },
  };
}
