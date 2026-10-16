/**
 * Routine presets — the ONE source of truth for what each gang of a room does.
 *
 * A gang is driven by CLICKS, not by press length. Each click advances one
 * stage: click 1 arms the first stage, click 2 the next, and the click after the
 * last stage turns the gang off. A gang with no stages is a plain on/off toggle.
 *
 * Routines are reusable: several rooms (e.g. a main toilet and a master toilet)
 * can share the same routine preset, so adding a second toilet is a registry
 * entry + a room config, never new code.
 */

export interface GangRoutine {
  /** 1-based gang index on the switch. */
  gang: number;
  /** Stable machine key, e.g. "led", "spotlights", "exhaust". */
  role: string;
  /** Human label rendered in the dashboard. */
  label: string;
  /**
   * Ordered press stages, in minutes. Click 1 -> stages[0], click 2 ->
   * stages[1], and so on; the click after the last stage turns the gang OFF.
   * Empty = a plain on/off toggle with no auto-off timer.
   */
  stages: number[];
  /** True when this gang deliberately has no auto-off timer (plain toggle). */
  noTimer?: boolean;
}

export interface RoomRoutine {
  /** Routine id; also the `roomType` a switch registry entry refers to. */
  id: string;
  /** Human name of the routine, e.g. "Toilet". */
  label: string;
  gangs: GangRoutine[];
}

export const ROUTINE_PRESETS: Record<string, RoomRoutine> = {
  toilet: {
    id: "toilet",
    label: "Toilet",
    gangs: [
      // click 1 -> 10 min, click 2 -> 30 min, click 3 -> off
      { gang: 1, role: "led", label: "LED profile", stages: [10, 30] },
      // click 1 -> 10 min, click 2 -> 30 min, click 3 -> off
      { gang: 2, role: "spotlights", label: "Spotlights", stages: [10, 30] },
      // exception: a single 10 min stage, so click 2 turns the fan off
      { gang: 3, role: "exhaust", label: "Exhaust fan", stages: [10] },
    ],
  },
  bedroom: {
    id: "bedroom",
    label: "Bedroom",
    gangs: [
      { gang: 1, role: "led", label: "LED", stages: [], noTimer: true },
      { gang: 2, role: "spotlights", label: "Spotlights", stages: [20, 30] },
    ],
  },
};

/** Routine presets keyed by the room type a switch is configured with. */
export function getRoutineForRoomType(
  roomType: string,
): RoomRoutine | undefined {
  return ROUTINE_PRESETS[roomType];
}

export function routineGangsFor(
  roomType: string,
  gangCount: number,
): GangRoutine[] {
  return (getRoutineForRoomType(roomType)?.gangs ?? []).filter(
    (gang) => gang.gang >= 1 && gang.gang <= gangCount,
  );
}

/**
 * Human hint for a gang card, e.g. "10m → 30m → off" (toilet LED) or
 * "10m → off" (exhaust). A stage-less gang reads "On / off".
 */
export function routineHint(gang: GangRoutine): string {
  if (gang.stages.length === 0) return "On / off";
  return `${gang.stages.map((minutes) => `${minutes}m`).join(" → ")} → off`;
}
