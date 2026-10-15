export const DEFAULT_IDLE_MINUTES: number;
export type IdleState = "awake" | "asleep" | "waking";
export function idleTransition(state: IdleState, event: string, enabled?: boolean, activePointers?: number): {state: IdleState; consume: boolean};
