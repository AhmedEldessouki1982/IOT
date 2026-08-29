import { useState } from "react";

/**
 * Local-only on/off state for the dummy lights (no backend). Lifted to the
 * dashboard so all room cards stay in sync; the first dummy light defaults on
 * to give the grid a warm, occupied look.
 */
export function useDummyLights(ids: string[]) {
  const [states, setStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ids.map((id, i) => [id, i === 0])),
  );
  const toggle = (id: string) =>
    setStates((prev) => ({ ...prev, [id]: !prev[id] }));
  return { states, toggle };
}
