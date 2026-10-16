import { RoomType } from "../common/press.types";
import { ROUTINE_PRESETS } from "../routines/routine.config";

export interface GangTimerRule {
  role: string;
  /** Ordered press stages in minutes (empty = plain on/off, no timer). */
  stages: number[];
  noTimer?: boolean;
}

const ROUTEABLE_ROOM_TYPES: RoomType[] = ["toilet", "bedroom"];

/**
 * Timer rules are DERIVED from the routine presets so the roles, labels and
 * stages live in exactly one place (`routines/routine.config.ts`).
 * Automation keeps reading the same `TIMER_RULES[roomType][gang]` shape.
 */
export const TIMER_RULES: Record<RoomType, Record<number, GangTimerRule>> =
  Object.fromEntries(
    ROUTEABLE_ROOM_TYPES.map((roomType) => {
      const preset = ROUTINE_PRESETS[roomType];
      const gangs: Record<number, GangTimerRule> = {};
      for (const gang of preset?.gangs ?? []) {
        gangs[gang.gang] = {
          role: gang.label,
          stages: gang.stages,
          ...(gang.noTimer ? { noTimer: true } : {}),
        };
      }
      return [roomType, gangs];
    }),
  ) as Record<RoomType, Record<number, GangTimerRule>>;
