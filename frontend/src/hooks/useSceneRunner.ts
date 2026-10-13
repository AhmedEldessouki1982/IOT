import { useMemo, useState } from "react";
import type { DeviceState } from "../api/devices";
import type { ActivityItem } from "../components/ActivityPanel";
import { SCENES, type SceneAction } from "../dashboard/scenes";
import type { DeviceConfig } from "../features/devices";
import {
  isLiveConfig,
  liveBooleanValue,
  liveDeviceId,
  liveStateKey,
} from "../features/devices/deviceRuntime";

export interface SceneFeedback {
  id: string;
  label: string;
  detail: string;
  undo?: () => void;
}

interface UseSceneRunnerArgs {
  allConfigs: DeviceConfig[];
  liveConfigs: DeviceConfig[];
  liveDevices: Record<string, DeviceState>;
  dummyOn: Record<string, boolean>;
  resetDummy: (next: Record<string, boolean>) => void;
  setLiveBoolean: (
    deviceId: string,
    stateKey: string,
    value: boolean,
  ) => Promise<void>;
}

export function useSceneRunner({
  allConfigs,
  liveConfigs,
  liveDevices,
  dummyOn,
  resetDummy,
  setLiveBoolean,
}: UseSceneRunnerArgs) {
  const [lastScene, setLastScene] = useState<ActivityItem | null>(null);
  const [sceneFeedback, setSceneFeedback] = useState<SceneFeedback | null>(
    null,
  );
  const [pendingLiveIds, setPendingLiveIds] = useState<Record<string, boolean>>(
    {},
  );

  const commandLiveBoolean = (
    deviceId: string,
    stateKey: string,
    value: boolean,
  ) => {
    setPendingLiveIds((current) => ({ ...current, [deviceId]: true }));
    void setLiveBoolean(deviceId, stateKey, value).finally(() => {
      window.setTimeout(() => {
        setPendingLiveIds((current) => {
          const next = { ...current };
          delete next[deviceId];
          return next;
        });
      }, 900);
    });
  };

  const anythingOn = useMemo(() => {
    const liveActive = liveConfigs.some((d) => {
      const deviceId = liveDeviceId(d);
      const value = deviceId
        ? liveBooleanValue(d, liveDevices[deviceId])
        : undefined;
      if (d.kind === "lock") return value === false;
      return value === true;
    });
    if (liveActive) return true;
    return allConfigs.some((d) => {
      if (isLiveConfig(d)) return false;
      if (d.kind === "lock") return (dummyOn[d.id] ?? true) === false;
      if (d.kind === "light") return dummyOn[d.id] ?? false;
      if (d.kind === "appliance" || d.kind === "smoke") {
        return dummyOn[d.id] ?? false;
      }
      return false;
    });
  }, [allConfigs, dummyOn, liveConfigs, liveDevices]);

  const handleShutdown = () => {
    liveConfigs.forEach((config) => {
      const deviceId = liveDeviceId(config);
      if (!deviceId) return;
      const target = config.kind === "lock";
      commandLiveBoolean(deviceId, liveStateKey(config.kind), target);
    });
    const next: Record<string, boolean> = {};
    allConfigs.forEach((d) => {
      if (isLiveConfig(d)) return;
      if (d.kind === "light" && !d.deviceId) next[d.id] = false;
      if (d.kind === "lock") next[d.id] = true;
      if (d.kind === "appliance") next[d.id] = false;
      if (d.kind === "smoke") next[d.id] = false;
    });
    resetDummy(next);
    setLastScene({
      id: `shutdown-${Date.now()}`,
      label: "Shutdown applied",
      detail: "Lights off, doors locked",
      at: new Date().toISOString(),
      tone: "warn",
    });
    setSceneFeedback({
      id: `shutdown-${Date.now()}`,
      label: "Shutdown applied",
      detail: "Lights off, doors locked",
    });
  };

  const applyScene = (sceneId: string) => {
    const scene = SCENES.find((s) => s.id === sceneId);
    if (!scene) return;
    const byId = new Map(allConfigs.map((d) => [d.id, d]));
    const previousDummy = { ...dummyOn };
    const previousLive = new Map<string, boolean | undefined>();
    const nextDummy = { ...dummyOn };
    const applyAction = (action: SceneAction) => {
      const config = byId.get(action.id);
      if (!config) return;
      const deviceId = liveDeviceId(config);
      if (deviceId) {
        previousLive.set(
          deviceId,
          liveBooleanValue(config, liveDevices[deviceId]),
        );
        commandLiveBoolean(deviceId, liveStateKey(config.kind), action.value);
        return;
      }
      nextDummy[action.id] = action.value;
    };
    scene.actions.forEach(applyAction);
    resetDummy(nextDummy);
    setLastScene({
      id: `scene-${scene.id}-${Date.now()}`,
      label: `${scene.label} scene applied`,
      detail: `${scene.actions.length} devices updated`,
      at: new Date().toISOString(),
      tone: scene.id === "away" ? "good" : "info",
    });
    setSceneFeedback({
      id: `scene-${scene.id}-${Date.now()}`,
      label: `${scene.label} applied`,
      detail: `${scene.actions.length} devices updated`,
      undo: () => {
        resetDummy(previousDummy);
        previousLive.forEach((value, deviceId) => {
          const config = [...byId.values()].find(
            (candidate) => liveDeviceId(candidate) === deviceId,
          );
          if (config && typeof value === "boolean") {
            commandLiveBoolean(deviceId, liveStateKey(config.kind), value);
          }
        });
        setSceneFeedback({
          id: `undo-${scene.id}-${Date.now()}`,
          label: `${scene.label} undone`,
          detail: "Previous device state restored",
        });
      },
    });
  };

  return {
    anythingOn,
    applyScene,
    handleShutdown,
    lastScene,
    pendingLiveIds,
    sceneFeedback,
  };
}
