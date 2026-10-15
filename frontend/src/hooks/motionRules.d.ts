export const LOCAL_ACTION_WINDOW_MS: number;
export function valueChanged(previous: unknown, next: unknown): boolean;
export function isExternalChange(previous: unknown, next: unknown, lastLocal: number | undefined, now: number): boolean;
export function animatedInteger(from: number, to: number, elapsed: number, duration: number, reduced?: boolean): number;
export function staggerDelay(index: number, step: number, reduced?: boolean): number;
