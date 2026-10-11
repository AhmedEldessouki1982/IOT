import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

export interface TimerEntry {
  deviceId: string;
  gang: number;
  expiresAt: string;
  remainingSeconds: number;
}

export function useTimers() {
  const [timers, setTimers] = useState<TimerEntry[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchTimers = async () => {
      try {
        const data = await apiGet<TimerEntry[]>("/api/timers");
        if (mounted) setTimers(data);
      } catch (e) {
        // ignore
      }
    };
    fetchTimers();
    const id = setInterval(fetchTimers, 500);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return timers;
}
