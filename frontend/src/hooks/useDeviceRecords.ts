import { useMemo } from "react";
import type { DeviceState } from "../api/devices";
import { ROOMS } from "../dashboard/rooms";
import type { DeviceConfig } from "../features/devices";
import {
  deviceBooleanValue,
  liveDeviceId,
} from "../features/devices/deviceRuntime";

export interface DeviceRecord {
  config: DeviceConfig;
  roomName: string;
  liveId?: string;
  source: "live" | "demo";
  health: "online" | "stale" | "unavailable" | "pending" | "demo";
  stateText: string;
  lastSeen?: string;
}

export interface ReadinessSummary {
  total: number;
  live: number;
  demo: number;
  onlineLive: number;
  attention: number;
  score: number;
}

export function useDeviceRecords(
  liveDevices: Record<string, DeviceState>,
  dummyOn: Record<string, boolean>,
  pendingLiveIds: Record<string, boolean>,
) {
  const deviceRecords = useMemo<DeviceRecord[]>(() => {
    const now = Date.now();
    return ROOMS.flatMap((room) =>
      [...room.devices, ...(room.switches ?? [])].map((config) => {
        const liveId = liveDeviceId(config);
        const device = liveId ? liveDevices[liveId] : undefined;
        const lastSeenMs = device ? new Date(device.timestamp).getTime() : 0;
        const stale =
          !!device &&
          Number.isFinite(lastSeenMs) &&
          now - lastSeenMs > 5 * 60 * 1000;
        const value = deviceBooleanValue(config, liveDevices, dummyOn);
        const stateText =
          config.kind === "lock"
            ? value === false
              ? "Unlocked"
              : "Locked"
            : config.kind === "smoke"
              ? value
                ? "Alarm"
                : "Armed"
              : config.kind === "gas-leak"
                ? value
                  ? "Detected"
                  : "Safe"
                : value
                  ? "On"
                  : "Off";
        return {
          config,
          roomName: room.name,
          liveId,
          source: liveId ? "live" : "demo",
          health: liveId
            ? pendingLiveIds[liveId]
              ? "pending"
              : device
                ? stale
                  ? "stale"
                  : "online"
                : "unavailable"
            : "demo",
          stateText,
          lastSeen: device?.timestamp,
        };
      }),
    );
  }, [dummyOn, liveDevices, pendingLiveIds]);

  const securityRecords = useMemo(
    () =>
      deviceRecords.filter(
        ({ config }) =>
          config.kind === "lock" ||
          config.kind === "smoke" ||
          config.kind === "gas-leak",
      ),
    [deviceRecords],
  );

  const unavailableLiveCount = deviceRecords.filter(
    (record) =>
      record.health === "unavailable" ||
      record.health === "stale" ||
      record.health === "pending",
  ).length;

  const readiness = useMemo<ReadinessSummary>(() => {
    const total = deviceRecords.length;
    const live = deviceRecords.filter(
      (record) => record.source === "live",
    ).length;
    const onlineLive = deviceRecords.filter(
      (record) => record.source === "live" && record.health === "online",
    ).length;
    const attention = unavailableLiveCount;
    const score =
      total === 0 ? 0 : Math.round(((total - attention) / total) * 100);
    return {
      total,
      live,
      demo: total - live,
      onlineLive,
      attention,
      score,
    };
  }, [deviceRecords, unavailableLiveCount]);

  return { deviceRecords, securityRecords, unavailableLiveCount, readiness };
}
