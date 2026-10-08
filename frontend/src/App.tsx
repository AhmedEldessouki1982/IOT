import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useHomeStore } from "./store/useHomeStore";
import { useDummyToggles } from "./features/devices/useDummyToggles";
import { ROOMS } from "./dashboard/rooms";
import type { DeviceConfig } from "./features/devices";
import {
  isLiveConfig,
  liveBooleanValue,
  liveDeviceId,
  liveStateKey,
} from "./features/devices/deviceRuntime";
import { getDeviceHistory, type DeviceHistoryEntry } from "./api/devices";
import RoomCard from "./dashboard/RoomCard";
import RoomDetail from "./dashboard/RoomDetail";
import ThemeToggle from "./components/ThemeToggle";
import EmergencyShutdown from "./components/EmergencyShutdown";
import SceneControls from "./components/SceneControls";
import HomeStatusStrip, {
  statusIcon,
  type HomeStatusItem,
} from "./components/HomeStatusStrip";
import ActivityPanel, { type ActivityItem } from "./components/ActivityPanel";
import { SCENES, type SceneAction } from "./dashboard/scenes";
import "./index.css";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return {
    time: now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    date: now.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}

/** Bento card dashboard — display type, glass, spatial light. */
export default function App() {
  const online = useHomeStore((s) => s.online);
  const homeLoadAll = useHomeStore((s) => s.loadAll);
  // Live MQTT devices keyed by backend device id.
  const liveDevices = useHomeStore((s) => s.devices);
  const setLiveBoolean = useHomeStore((s) => s.setBoolean);
  const allConfigs = useMemo(
    () => ROOMS.flatMap((r) => [...r.devices, ...(r.switches ?? [])]),
    [],
  );
  const liveConfigs = useMemo(() => allConfigs.filter(isLiveConfig), [allConfigs]);
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
  const { time, date } = useClock();
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);
  const [history, setHistory] = useState<DeviceHistoryEntry[]>([]);
  const [lastScene, setLastScene] = useState<ActivityItem | null>(null);

  // Non-live lights default off; locks default locked — each dummy device
  // seeds its own starting value instead of one blanket default.
  const dummyInitial = useMemo(() => {
    const initial: Record<string, boolean> = {};
    let firstDummyLightSeen = false;
    allConfigs.forEach((d) => {
      if (d.kind === "light" && !d.deviceId) {
        // first dummy light on for a warm, occupied look; rest start off
        initial[d.id] = !firstDummyLightSeen;
        firstDummyLightSeen = true;
      }
      if (d.kind === "lock") initial[d.id] = d.locked ?? true;
      if (d.kind === "appliance") initial[d.id] = false;
      if (d.kind === "smoke") initial[d.id] = d.active ?? false;
    });
    return initial;
  }, [allConfigs]);
  const {
    states: dummyOn,
    toggle: toggleDummy,
    reset: resetDummy,
  } = useDummyToggles(dummyInitial);

  // Emergency shutdown: everything off — every live MQTT device off
  // (light1 + sonoff relays), every dummy light off, and every door lock
  // locked. `shutdownActive` reflects whether anything is currently on /
  // unlocked so the button can state itself.
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
      void setLiveBoolean(deviceId, liveStateKey(config.kind), target);
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
  };

  const applyScene = (sceneId: string) => {
    const scene = SCENES.find((s) => s.id === sceneId);
    if (!scene) return;
    const byId = new Map(allConfigs.map((d) => [d.id, d]));
    const nextDummy = { ...dummyOn };
    const applyAction = (action: SceneAction) => {
      const config = byId.get(action.id);
      if (!config) return;
      const deviceId = liveDeviceId(config);
      if (deviceId) {
        void setLiveBoolean(deviceId, liveStateKey(config.kind), action.value);
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
  };

  useEffect(() => {
    // One bulk GET /devices seeds every device that has ever reported state
    // (light1 + sonoff relays) — no per-device requests, so unknown ids can
    // never 404 into the console.
    homeLoadAll();
  }, [homeLoadAll]);

  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    Promise.all(
      liveConfigs
        .map(liveDeviceId)
        .filter((id): id is string => !!id)
        .map((id) => getDeviceHistory(id).catch(() => [])),
    ).then((groups) => {
      if (cancelled) return;
      setHistory(
        groups
          .flat()
          .sort(
            (a, b) =>
              new Date(b.recordedAt).getTime() -
              new Date(a.recordedAt).getTime(),
          ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [online, liveConfigs, liveDevices]);

  const valueForConfig = (config: DeviceConfig): boolean | undefined => {
    const deviceId = liveDeviceId(config);
    if (deviceId) return liveBooleanValue(config, liveDevices[deviceId]);
    if (config.kind === "lock") return dummyOn[config.id] ?? config.locked ?? true;
    if (config.kind === "light") return dummyOn[config.id] ?? false;
    if (config.kind === "appliance") return dummyOn[config.id] ?? false;
    if (config.kind === "smoke") return dummyOn[config.id] ?? config.active ?? false;
    if (config.kind === "gas-leak") return config.detected ?? false;
    return undefined;
  };

  const statusItems = useMemo<HomeStatusItem[]>(() => {
    const lights = allConfigs.filter((config) => config.kind === "light");
    const lightsOn = lights.filter((config) => valueForConfig(config) === true);
    const locks = allConfigs.filter((config) => config.kind === "lock");
    const locked = locks.filter((config) => valueForConfig(config) !== false);
    const sensors = allConfigs.filter(
      (config) => config.kind === "smoke" || config.kind === "gas-leak",
    );
    const sensorsSafe = sensors.every((config) => valueForConfig(config) !== true);
    const latest = history[0]?.recordedAt ?? lastScene?.at;
    const latestLabel = latest
      ? new Date(latest).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "No events";
    return [
      {
        id: "lights",
        label: "Lights on",
        value: `${lightsOn.length}/${lights.length}`,
        tone: lightsOn.length > 0 ? "warn" : "good",
        icon: statusIcon("lights"),
      },
      {
        id: "doors",
        label: "Doors locked",
        value: `${locked.length}/${locks.length}`,
        tone: locked.length === locks.length ? "good" : "danger",
        icon: statusIcon("doors"),
      },
      {
        id: "sensors",
        label: "Sensors",
        value: sensorsSafe ? "Safe" : "Alert",
        tone: sensorsSafe ? "good" : "danger",
        icon: statusIcon("sensors"),
      },
      {
        id: "mqtt",
        label: "MQTT",
        value: online ? "Live" : "Offline",
        tone: online ? "good" : "danger",
        icon: statusIcon("mqtt"),
      },
      {
        id: "activity",
        label: "Last activity",
        value: latestLabel,
        tone: "info",
        icon: statusIcon("activity"),
      },
    ];
  }, [allConfigs, dummyOn, history, lastScene, liveDevices, online]);

  const activityItems = useMemo<ActivityItem[]>(() => {
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

  const openRoom = openRoomId
    ? (ROOMS.find((r) => r.id === openRoomId) ?? null)
    : null;

  // Esc closes the room detail view.
  useEffect(() => {
    if (!openRoomId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenRoomId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openRoomId]);

  return (
    <div className="dash">
      <header className="dash-head">
        <div className="dash-greeting">
          <div className="dash-greeting-top">
            <h1>Hi, Ahmed</h1>
            <span className="dash-clock" aria-live="off">
              <span className="dash-time">{time}</span>
              <span className="dash-date">{date}</span>
            </span>
          </div>
          <p data-online={online}>
            <span className="dash-status-dot" aria-hidden="true" />
            {online ? "All systems OK — live" : "Offline — local controls only"}
          </p>
        </div>
        <span className="dash-controls">
          <SceneControls scenes={SCENES} onApply={applyScene} />
          <ThemeToggle />
          <EmergencyShutdown onShutdown={handleShutdown} active={anythingOn} />
          <span className="dash-summary">
            {ROOMS.length} rooms ·{" "}
            {ROOMS.reduce(
              (a, r) => a + r.devices.length + (r.switches?.length ?? 0),
              0,
            )}{" "}
            devices
          </span>
        </span>
      </header>

      <section className="dash-overview" aria-label="Home overview">
        <HomeStatusStrip items={statusItems} />
        <ActivityPanel items={activityItems} />
      </section>

      <main className="dash-grid">
        {ROOMS.map((room, i) => (
          <RoomCard
            key={room.id}
            id={room.id}
            name={room.name}
            devices={room.devices}
            switches={room.switches}
            span={room.span}
            index={i}
            dummyOn={dummyOn}
            onDummyToggle={toggleDummy}
            onExpand={setOpenRoomId}
          />
        ))}
      </main>

      <AnimatePresence>
        {openRoom && (
          <RoomDetail
            id={openRoom.id}
            name={openRoom.name}
            devices={openRoom.devices}
            switches={openRoom.switches}
            dummyOn={dummyOn}
            onDummyToggle={toggleDummy}
            onClose={() => setOpenRoomId(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
