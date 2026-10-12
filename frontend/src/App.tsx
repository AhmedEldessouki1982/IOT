import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Activity,
  BellRing,
  CheckCircle2,
  Clock3,
  Filter,
  Home,
  LayoutGrid,
  ListChecks,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Undo2,
  WifiOff,
} from "lucide-react";
import { useHomeStore } from "./store/useHomeStore";
import { useDummyToggles } from "./features/devices/useDummyToggles";
import { ROOMS } from "./dashboard/rooms";
import type { DeviceConfig } from "./features/devices";
import {
  isLiveConfig,
  liveBooleanValue,
  liveDeviceId,
  liveStateKey,
  deviceBooleanValue,
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

type AppView =
  | "home"
  | "rooms"
  | "scenes"
  | "security"
  | "devices"
  | "activity"
  | "settings";

interface SceneFeedback {
  id: string;
  label: string;
  detail: string;
  undo?: () => void;
}

interface DeviceRecord {
  config: DeviceConfig;
  roomName: string;
  liveId?: string;
  source: "live" | "demo";
  health: "online" | "stale" | "unavailable" | "pending" | "demo";
  stateText: string;
  lastSeen?: string;
}

type DeviceHealthFilter = "all" | DeviceRecord["health"];
type DeviceSourceFilter = "all" | DeviceRecord["source"];

const NAV_ITEMS: Array<{
  id: AppView;
  label: string;
  icon: typeof Home;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "rooms", label: "Rooms", icon: LayoutGrid },
  { id: "scenes", label: "Scenes", icon: SlidersHorizontal },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "devices", label: "Devices", icon: Radio },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

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
  const [activeView, setActiveView] = useState<AppView>("home");
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);
  const [history, setHistory] = useState<DeviceHistoryEntry[]>([]);
  const [lastScene, setLastScene] = useState<ActivityItem | null>(null);
  const [sceneFeedback, setSceneFeedback] = useState<SceneFeedback | null>(null);
  const [pendingLiveIds, setPendingLiveIds] = useState<Record<string, boolean>>({});
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceHealthFilter, setDeviceHealthFilter] =
    useState<DeviceHealthFilter>("all");
  const [deviceSourceFilter, setDeviceSourceFilter] =
    useState<DeviceSourceFilter>("all");

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
        previousLive.set(deviceId, liveBooleanValue(config, liveDevices[deviceId]));
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

  const valueForConfig = (config: DeviceConfig) =>
    deviceBooleanValue(config, liveDevices, dummyOn);

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

  const filteredDeviceRecords = useMemo(() => {
    const query = deviceSearch.trim().toLowerCase();
    return deviceRecords.filter((record) => {
      const matchesQuery =
        !query ||
        record.config.label.toLowerCase().includes(query) ||
        record.roomName.toLowerCase().includes(query) ||
        record.config.kind.toLowerCase().includes(query) ||
        (record.liveId ?? "").toLowerCase().includes(query);
      const matchesHealth =
        deviceHealthFilter === "all" || record.health === deviceHealthFilter;
      const matchesSource =
        deviceSourceFilter === "all" || record.source === deviceSourceFilter;
      return matchesQuery && matchesHealth && matchesSource;
    });
  }, [deviceHealthFilter, deviceRecords, deviceSearch, deviceSourceFilter]);

  const readiness = useMemo(() => {
    const total = deviceRecords.length;
    const live = deviceRecords.filter((record) => record.source === "live").length;
    const onlineLive = deviceRecords.filter(
      (record) => record.source === "live" && record.health === "online",
    ).length;
    const attention = unavailableLiveCount;
    const score = total === 0 ? 0 : Math.round(((total - attention) / total) * 100);
    return {
      total,
      live,
      demo: total - live,
      onlineLive,
      attention,
      score,
    };
  }, [deviceRecords, unavailableLiveCount]);

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

  const renderRoomGrid = (limit?: number) => (
    <main className="dash-grid">
      {ROOMS.slice(0, limit).map((room, i) => (
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
  );

  const formatLastSeen = (value?: string) => {
    if (!value) return "Never";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const renderKpiRail = () => (
    <section className="kpi-rail" aria-label="Framework readiness summary">
      <article className="kpi-card" data-tone={readiness.score > 85 ? "good" : "warn"}>
        <span>Readiness</span>
        <strong>{readiness.score}%</strong>
        <small>{readiness.attention} live device checks</small>
      </article>
      <article className="kpi-card">
        <span>Registry</span>
        <strong>{readiness.total}</strong>
        <small>{readiness.live} live · {readiness.demo} demo</small>
      </article>
      <article className="kpi-card" data-tone={online ? "good" : "danger"}>
        <span>Backend</span>
        <strong>{online ? "Live" : "Offline"}</strong>
        <small>{readiness.onlineLive}/{readiness.live} live reporting</small>
      </article>
    </section>
  );

  const renderScenes = () => (
    <section className="business-panel">
      <div className="panel-headline">
        <span className="panel-kicker">Scenes</span>
        <h2>Repeatable customer moments</h2>
        <p>
          Scenes are the customer-friendly layer over device commands. Each
          preset shows the number of controlled devices and gives immediate
          feedback after it runs.
        </p>
      </div>
      <div className="scene-library">
        {SCENES.map((scene) => {
          const Icon = scene.icon;
          return (
            <article key={scene.id} className="scene-preset-card">
              <span className="scene-preset-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <div>
                <h3>{scene.label}</h3>
                <p>{scene.actions.length} device actions</p>
              </div>
              <button type="button" onClick={() => applyScene(scene.id)}>
                Apply
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );

  const renderSecurity = () => (
    <section className="business-panel business-panel--split">
      <div>
        <div className="panel-headline">
          <span className="panel-kicker">Security</span>
          <h2>Locks and life-safety at a glance</h2>
          <p>
            This view collects the devices a customer checks before sleeping,
            leaving, or handing over the home.
          </p>
        </div>
        <div className="security-grid">
          {securityRecords.map((record) => (
            <article
              key={record.config.id}
              className="security-card"
              data-health={record.health}
            >
              <span className="security-card-icon" aria-hidden="true">
                {record.config.kind === "lock" ? (
                  <ShieldCheck size={18} />
                ) : (
                  <BellRing size={18} />
                )}
              </span>
              <span>
                <strong>{record.config.label}</strong>
                <small>{record.roomName}</small>
              </span>
              <em>{record.stateText}</em>
            </article>
          ))}
        </div>
      </div>
      <ActivityPanel items={activityItems} maxItems={8} title="Security trail" />
    </section>
  );

  const renderDevices = () => (
    <section className="business-panel">
      <div className="panel-headline">
        <span className="panel-kicker">Installer view</span>
        <h2>Device registry and health</h2>
        <p>
          A business deployment needs clear live/demo separation, last-seen
          checks, and stale/unavailable states before anything reaches a
          customer wall panel.
        </p>
      </div>
      {renderKpiRail()}
      <div className="device-toolbar" aria-label="Device filters">
        <label className="field-control field-control--search">
          <Search size={14} strokeWidth={1.8} aria-hidden="true" />
          <input
            value={deviceSearch}
            onChange={(event) => setDeviceSearch(event.target.value)}
            placeholder="Search room, device, type, or live id"
            type="search"
          />
        </label>
        <label className="field-control">
          <Filter size={14} strokeWidth={1.8} aria-hidden="true" />
          <select
            value={deviceHealthFilter}
            onChange={(event) =>
              setDeviceHealthFilter(event.target.value as DeviceHealthFilter)
            }
          >
            <option value="all">All health</option>
            <option value="online">Online</option>
            <option value="pending">Pending</option>
            <option value="stale">Stale</option>
            <option value="unavailable">Unavailable</option>
            <option value="demo">Demo</option>
          </select>
        </label>
        <label className="field-control">
          <Radio size={14} strokeWidth={1.8} aria-hidden="true" />
          <select
            value={deviceSourceFilter}
            onChange={(event) =>
              setDeviceSourceFilter(event.target.value as DeviceSourceFilter)
            }
          >
            <option value="all">All sources</option>
            <option value="live">Live only</option>
            <option value="demo">Demo only</option>
          </select>
        </label>
        <span className="device-result-count">
          {filteredDeviceRecords.length}/{deviceRecords.length} shown
        </span>
      </div>
      <div className="device-admin-list">
        {filteredDeviceRecords.map((record) => (
          <article
            key={record.config.id}
            className="device-admin-row"
            data-health={record.health}
          >
            <span className="device-admin-state">
              {record.health === "online" && <CheckCircle2 size={15} />}
              {record.health === "stale" && <Clock3 size={15} />}
              {record.health === "pending" && <Clock3 size={15} />}
              {record.health === "unavailable" && <WifiOff size={15} />}
              {record.health === "demo" && <ListChecks size={15} />}
            </span>
            <span className="device-admin-main">
              <strong>{record.config.label}</strong>
              <small>
                {record.roomName} · {record.config.kind}
                {record.liveId ? ` · ${record.liveId}` : " · demo"}
              </small>
            </span>
            <span className="device-admin-pill">{record.stateText}</span>
            <span className="device-admin-last">
              {record.source === "live" ? formatLastSeen(record.lastSeen) : "Demo"}
            </span>
          </article>
        ))}
        {filteredDeviceRecords.length === 0 && (
          <div className="empty-state">
            <strong>No devices match these filters</strong>
            <span>Clear the search or switch the health/source filters.</span>
          </div>
        )}
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="business-panel">
      <div className="panel-headline">
        <span className="panel-kicker">Framework</span>
        <h2>Business-ready defaults</h2>
        <p>
          This app is now structured as a reusable local-first smart-home
          framework. The next backend milestone is moving this room/device
          registry out of code and into customer configuration.
        </p>
      </div>
      {renderKpiRail()}
      <div className="settings-grid">
        <article>
          <Radio size={18} />
          <strong>Local-first MQTT</strong>
          <span>{online ? "Backend reachable" : "Backend offline"}</span>
        </article>
        <article>
          <LayoutGrid size={18} />
          <strong>Config model</strong>
          <span>{ROOMS.length} rooms · {deviceRecords.length} devices</span>
        </article>
        <article>
          <ShieldCheck size={18} />
          <strong>Deployment readiness</strong>
          <span>{unavailableLiveCount} live devices need attention</span>
        </article>
      </div>
    </section>
  );

  const renderActiveView = () => {
    if (activeView === "home") {
      return (
        <>
          <section className="dash-overview" aria-label="Home overview">
            <HomeStatusStrip items={statusItems} />
            <ActivityPanel items={activityItems} />
          </section>
          {renderRoomGrid(4)}
        </>
      );
    }
    if (activeView === "rooms") return renderRoomGrid();
    if (activeView === "scenes") return renderScenes();
    if (activeView === "security") return renderSecurity();
    if (activeView === "devices") return renderDevices();
    if (activeView === "activity") {
      return (
        <section className="business-panel">
          <ActivityPanel items={activityItems} maxItems={20} title="Activity history" />
        </section>
      );
    }
    return renderSettings();
  };

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

      <nav className="app-nav" aria-label="App sections">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="app-nav-item"
              data-active={activeView === item.id ? "true" : "false"}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {sceneFeedback && (
        <section className="scene-feedback" aria-live="polite">
          <span>
            <strong>{sceneFeedback.label}</strong>
            <small>{sceneFeedback.detail}</small>
          </span>
          {sceneFeedback.undo && (
            <button type="button" onClick={sceneFeedback.undo}>
              <Undo2 size={14} strokeWidth={1.8} aria-hidden="true" />
              Undo
            </button>
          )}
        </section>
      )}

      {renderActiveView()}

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
