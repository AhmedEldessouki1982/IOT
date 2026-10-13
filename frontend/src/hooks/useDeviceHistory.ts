import { useEffect, useMemo, useRef, useState } from "react";
import { getDeviceHistory, type DeviceHistoryEntry } from "../api/devices";
import type { DeviceConfig } from "../features/devices";
import { liveDeviceId } from "../features/devices/deviceRuntime";
import type { DeviceState } from "../api/devices";

async function loadHistoryFor(ids: string[]): Promise<DeviceHistoryEntry[]> {
  const groups = await Promise.all(
    ids.map((id) => getDeviceHistory(id).catch(() => [])),
  );
  return groups
    .flat()
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
}

export function useDeviceHistory(
  liveConfigs: DeviceConfig[],
  liveDevices: Record<string, DeviceState>,
  online: boolean,
): DeviceHistoryEntry[] {
  const [history, setHistory] = useState<DeviceHistoryEntry[]>([]);
  const knownTimestamps = useRef(new Map<string, string | undefined>());
  const liveIds = useMemo(
    () =>
      liveConfigs
        .map(liveDeviceId)
        .filter((id): id is string => typeof id === "string"),
    [liveConfigs],
  );
  const liveIdsKey = liveIds.join("|");
  const liveTimestampKey = liveIds
    .map((id) => `${id}:${liveDevices[id]?.timestamp ?? ""}`)
    .join("|");

  useEffect(() => {
    if (!online || liveIds.length === 0) return;
    let cancelled = false;
    void loadHistoryFor(liveIds).then((next) => {
      if (cancelled) return;
      setHistory(next);
      knownTimestamps.current = new Map(
        liveIds.map((id) => [id, liveDevices[id]?.timestamp]),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [liveIdsKey, online]);

  useEffect(() => {
    if (!online || liveIds.length === 0) return;
    const changedIds = liveIds.filter((id) => {
      const next = liveDevices[id]?.timestamp;
      const previous = knownTimestamps.current.get(id);
      return next && next !== previous;
    });
    if (changedIds.length === 0) return;

    const id = window.setTimeout(() => {
      void loadHistoryFor(changedIds).then((next) => {
        setHistory((current) =>
          [...next, ...current]
            .filter(
              (entry, index, list) =>
                list.findIndex(
                  (candidate) =>
                    candidate.deviceId === entry.deviceId &&
                    candidate.recordedAt === entry.recordedAt,
                ) === index,
            )
            .sort(
              (a, b) =>
                new Date(b.recordedAt).getTime() -
                new Date(a.recordedAt).getTime(),
            ),
        );
        changedIds.forEach((deviceId) => {
          knownTimestamps.current.set(
            deviceId,
            liveDevices[deviceId]?.timestamp,
          );
        });
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [liveIdsKey, liveTimestampKey, online]);

  return history;
}
