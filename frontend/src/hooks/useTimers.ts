import { useEffect, useSyncExternalStore } from "react";
import { apiGet } from "../lib/api";
import { homeSocket } from "../store/useHomeStore";

export interface TimerEntry {
  deviceId: string;
  gang: number;
  expiresAt: string;
  remainingSeconds: number;
  durationSeconds?: number;
}

type TimerListener = () => void;

let timers: TimerEntry[] = [];
let now = Date.now();
let snapshot: TimerEntry[] = [];
let refs = 0;
let tickId: number | undefined;
let stopId: number | undefined;
let started = false;
let sawInitialConnect = false;
const listeners = new Set<TimerListener>();

const buildSnapshot = () =>
  timers
    .map((timer) => ({
      ...timer,
      remainingSeconds: Math.max(
        0,
        Math.ceil((new Date(timer.expiresAt).getTime() - now) / 1000),
      ),
    }))
    .filter((timer) => timer.remainingSeconds > 0);

const emit = () => {
  snapshot = buildSnapshot();
  listeners.forEach((listener) => listener());
};

const currentTimers = () => snapshot;

const fetchTimers = async () => {
  try {
    timers = await apiGet<TimerEntry[]>("/api/timers");
    emit();
  } catch {
    // backend offline or starting; keep the last timer snapshot
  }
};

const handleUpdate = (next: TimerEntry[]) => {
  if (!Array.isArray(next)) return;
  timers = next;
  emit();
};

const handleConnect = () => {
  if (!sawInitialConnect) {
    sawInitialConnect = true;
    return;
  }
  fetchTimers();
};

const startSharedTimerClient = () => {
  if (stopId !== undefined) {
    window.clearTimeout(stopId);
    stopId = undefined;
  }
  if (started) return;
  started = true;
  sawInitialConnect = homeSocket.connected;
  fetchTimers();
  homeSocket.on("connect", handleConnect);
  homeSocket.on("timer:update", handleUpdate);
  tickId = window.setInterval(() => {
    now = Date.now();
    emit();
  }, 1000);
};

const stopSharedTimerClient = () => {
  if (!started || refs > 0) return;
  if (stopId !== undefined) return;
  stopId = window.setTimeout(() => {
    stopId = undefined;
    if (!started || refs > 0) return;
    started = false;
    homeSocket.off("connect", handleConnect);
    homeSocket.off("timer:update", handleUpdate);
    if (tickId !== undefined) {
      window.clearInterval(tickId);
      tickId = undefined;
    }
  }, 0);
};

const subscribe = (listener: TimerListener) => {
  listeners.add(listener);
  refs += 1;
  startSharedTimerClient();
  return () => {
    listeners.delete(listener);
    refs = Math.max(0, refs - 1);
    stopSharedTimerClient();
  };
};

export function useTimers() {
  useEffect(() => {
    now = Date.now();
  }, []);
  return useSyncExternalStore(subscribe, currentTimers, currentTimers);
}
