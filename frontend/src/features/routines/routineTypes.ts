/**
 * Types for a room routine, as served by the backend `GET /api/rooms/:roomId`.
 *
 * The backend owns the roles ("LED profile", "Spotlights", "Exhaust fan"), the
 * click stages and their hint text, so every routine room renders the same
 * reusable components without duplicating that table in the frontend.
 */

export interface GangTimerView {
  remainingSeconds: number;
  expiresAt: string;
  durationSeconds?: number;
}

export interface GangView {
  gang: number;
  deviceId: string;
  role: string;
  label: string;
  /** Ordered press stages in minutes; empty = plain on/off toggle. */
  stages: number[];
  /** Card hint from the backend, e.g. "10m → 30m → off". */
  hint: string;
  /** 1-based stage currently armed by a running timer, or null when idle. */
  stage: number | null;
  on: boolean;
  timer: GangTimerView | null;
}

export interface RoomRoutineView {
  roomId: string;
  roomType: string;
  routineId: string;
  routineLabel: string;
  switchId: string;
  base: string;
  gangs: GangView[];
}
