import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";
import type { RoomRoutineView } from "./routineTypes";

/**
 * Fetch a room's routine (roles + durations) from the backend.
 *
 * Returns `null` while loading or when the backend is unreachable, so callers
 * can fall back to the room's static switch config. Re-fetching is deliberately
 * rare — live on/off and countdowns come from useHomeStore/useTimers, not here.
 */
export function useRoomRoutine(roomId?: string) {
  const [routine, setRoutine] = useState<RoomRoutineView | null>(null);
  const [loading, setLoading] = useState(Boolean(roomId));

  useEffect(() => {
    if (!roomId) {
      setRoutine(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    apiGet<RoomRoutineView>(`/api/rooms/${roomId}`)
      .then((next) => {
        if (alive) setRoutine(next);
      })
      .catch(() => {
        /* backend offline — keep whatever we had (callers fall back) */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [roomId]);

  return { routine, loading };
}
