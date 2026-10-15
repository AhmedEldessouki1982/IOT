import { staggerDelay } from "./motionRules.js";
import { motionMs } from "./motionTokens";

const actions = new Map<string, number>();
export function markLocalAction(key: string) { actions.set(key, Date.now()); }
export function lastLocalAction(key: string) { return actions.get(key); }
type FlashListener = (key: string, delay: number) => void;
const flashListeners = new Set<FlashListener>();
const pendingFlashes = new Map<string, { at: number; delay: number; lifetime: number }>();
export function subscribeSceneFlash(listener: FlashListener) {
  flashListeners.add(listener);
  // Newly revealed active rows also receive the scene's visual feedback.
  const now = Date.now();
  pendingFlashes.forEach((flash, key) => {
    if (now - flash.at < flash.lifetime) listener(key, Math.max(0, flash.delay - (now - flash.at)));
  });
  return () => { flashListeners.delete(listener); };
}
export function flashScene(keys: string[]) {
  pendingFlashes.clear();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  keys.forEach((key, index) => {
    markLocalAction(key);
    const delay = staggerDelay(index, motionMs("scene-step"), reduced);
    pendingFlashes.set(key, {at: Date.now(), delay, lifetime: delay + motionMs("flash")});
    flashListeners.forEach(listener => listener(key, delay));
  });
}
