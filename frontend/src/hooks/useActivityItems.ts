import { useMemo } from "react";
import type { DeviceHistoryEntry } from "../api/devices";
import type { DeviceConfig } from "../features/devices";
import { liveDeviceId } from "../features/devices/deviceRuntime";
import type { ActivityItem } from "../components/ActivityPanel";

export function useActivityItems(
  allConfigs: DeviceConfig[],
  history: DeviceHistoryEntry[],
  lastScene: ActivityItem | null,
): ActivityItem[] {
  const configById = useMemo(
    () => new Map(allConfigs.map((config) => [config.id, config])),
    [allConfigs],
  );
  const labelByLiveId = useMemo(() => {
    const map = new Map<string, string>();
    allConfigs.forEach((config) => {
      const deviceId = liveDeviceId(config);
      if (deviceId) map.set(deviceId, config.label);
    });
    return map;
  }, [allConfigs]);

  return useMemo(() => {
    const historyItems = history.map((entry) => {
      const label = labelByLiveId.get(entry.deviceId) ?? entry.deviceId;
      const config = configById.get(entry.deviceId);
      const on = entry.state.on;
      const locked = entry.state.locked;
      const stateText =
        typeof on === "boolean"
          ? on
            ? "turned on"
            : "turned off"
          : typeof locked === "boolean"
            ? locked
              ? "locked"
              : "unlocked"
            : "reported state";
      return {
        id: `${entry.deviceId}-${entry.recordedAt}`,
        label,
        detail: stateText,
        at: entry.recordedAt,
        tone:
          config?.kind === "lock" && locked === false
            ? "danger"
            : on === false || locked === true
              ? "good"
              : "info",
      } satisfies ActivityItem;
    });
    return [lastScene, ...historyItems]
      .filter((item): item is ActivityItem => !!item)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [configById, history, labelByLiveId, lastScene]);
}
