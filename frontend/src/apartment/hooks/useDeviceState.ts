import { useMemo } from "react";
import { useDeviceStore } from "../store/useDeviceStore";
import { defaultStateFor } from "../deviceDefaults";
import type { DeviceKind } from "../types";

/** Raw authoritative state for a device (undefined when backend hasn't seen it). */
export function useRawState(deviceId: string) {
  return useDeviceStore((s) => s.states[deviceId]);
}

/**
 * Visualization state = config defaults overlaid with whatever the real
 * device last published. Selected per-component (stable reference), merged
 * in a memo so zustand's equality check stays cheap.
 */
export function useMergedState(deviceId: string, kind: DeviceKind): Record<string, unknown> {
  const raw = useRawState(deviceId);
  return useMemo(
    () => ({ ...defaultStateFor(kind), ...(raw?.state ?? {}) }),
    [kind, raw],
  );
}
