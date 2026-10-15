import { staggerDelay } from "./motionRules.js";
import { motionMs } from "./motionTokens";

const actions = new Map<string, number>();
export function markLocalAction(key: string) { actions.set(key, Date.now()); }
export function lastLocalAction(key: string) { return actions.get(key); }
type FlashListener = (key: string, delay: number) => void;
const flashListeners = new Set<FlashListener>();
export function subscribeSceneFlash(listener: FlashListener) {
  flashListeners.add(listener);
  return () => { flashListeners.delete(listener); };
}
export function flashScene(keys: string[]) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  keys.forEach((key, index) => {
    markLocalAction(key);
    const delay = staggerDelay(index, motionMs("scene-step"), reduced);
    flashListeners.forEach(listener => listener(key, delay));
  });
}
