export type RoomType = 'toilet' | 'bedroom';

export type PressType = 'single' | 'long';

export interface GangTimerRule {
  role: string;
  durations: Partial<Record<PressType, number>>; // minutes
  noTimer?: boolean;
}

export const TIMER_RULES: Record<RoomType, Record<number, GangTimerRule>> = {
  toilet: {
    1: {
      role: 'LED',
      durations: { single: 10, long: 30 },
    },
    2: {
      role: 'Spotlights',
      durations: { single: 10, long: 20 },
    },
    3: {
      role: 'Exhaust fan',
      durations: { single: 10, long: 10 },
    },
  },
  bedroom: {
    1: {
      role: 'LED',
      durations: {},
      noTimer: true,
    },
    2: {
      role: 'Spotlights',
      durations: { single: 20, long: 30 },
    },
  },
};
