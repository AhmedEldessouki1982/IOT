import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Activity,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Radio,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
import { useHomeStore } from "./store/useHomeStore";
import { useDummyToggles } from "./features/devices/useDummyToggles";
import { ROOMS } from "./dashboard/rooms";
import { SCENES } from "./dashboard/scenes";
import type { DeviceConfig } from "./features/devices";
import {
  isLiveConfig,
  deviceBooleanValue,
} from "./features/devices/deviceRuntime";
import RoomDetail from "./dashboard/RoomDetail";
import { statusIcon, type HomeStatusItem } from "./components/HomeStatusStrip";
import HomeView from "./views/HomeView";
import RoomsView from "./views/RoomsView";
import ScenesView from "./views/ScenesView";
import SecurityView from "./views/SecurityView";
import DevicesView from "./views/DevicesView";
import ActivityView from "./views/ActivityView";
import SettingsView from "./views/SettingsView";
import ThemeToggle from "./components/ThemeToggle";
import { MotionReadiness } from "./hooks/MotionReadiness";
import ConnectionBanner from "./components/ConnectionBanner";
import ViewFrame from "./components/ViewFrame";
import { useSceneRunner } from "./hooks/useSceneRunner";
import { useDeviceRecords } from "./hooks/useDeviceRecords";
import { useDeviceHistory } from "./hooks/useDeviceHistory";
import { useActivityItems } from "./hooks/useActivityItems";

type AppView =
  | "home"
  | "rooms"
  | "scenes"
  | "security"
  | "devices"
  | "activity"
  | "settings";

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
  const [motionReady, setMotionReady] = useState(false);
  const online = useHomeStore((s) => s.online);
  const homeLoadAll = useHomeStore((s) => s.loadAll);
  // Live MQTT devices keyed by backend device id.
  const liveDevices = useHomeStore((s) => s.devices);
  const setLiveBoolean = useHomeStore((s) => s.setBoolean);
  const allConfigs = useMemo(
    () => ROOMS.flatMap((r) => [...r.devices, ...(r.switches ?? [])]),
    [],
  );
  const liveConfigs = useMemo(
    () => allConfigs.filter(isLiveConfig),
    [allConfigs],
  );
  const { time, date } = useClock();
  const [activeView, setActiveView] = useState<AppView>("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);

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

  const {
    anythingOn,
    applyScene,
    handleShutdown,
    lastScene,
    pendingLiveIds,
    sceneFeedback,
  } = useSceneRunner({
    allConfigs,
    liveConfigs,
    liveDevices,
    dummyOn,
    resetDummy,
    setLiveBoolean,
  });

  useEffect(() => {
    // One bulk GET /devices seeds every device that has ever reported state
    // (light1 + sonoff relays) — no per-device requests, so unknown ids can
    // never 404 into the console.
    let cancelled = false;
    let frame = 0;
    homeLoadAll().finally(() => {
      if (cancelled) return;
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => { if (!cancelled) setMotionReady(true); });
      });
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [homeLoadAll]);

  const history = useDeviceHistory(liveConfigs, liveDevices, online);

  const valueForConfig = (config: DeviceConfig) =>
    deviceBooleanValue(config, liveDevices, dummyOn);

  const { deviceRecords, securityRecords, unavailableLiveCount, readiness } =
    useDeviceRecords(liveDevices, dummyOn, pendingLiveIds);

  const statusItems = useMemo<HomeStatusItem[]>(() => {
    const lights = allConfigs.filter((config) => config.kind === "light");
    const lightsOn = lights.filter((config) => valueForConfig(config) === true);
    const locks = allConfigs.filter((config) => config.kind === "lock");
    const locked = locks.filter((config) => valueForConfig(config) !== false);
    const sensors = allConfigs.filter(
      (config) => config.kind === "smoke" || config.kind === "gas-leak",
    );
    const sensorsSafe = sensors.every(
      (config) => valueForConfig(config) !== true,
    );
    const latest = history[0]?.recordedAt ?? lastScene?.at;
    const latestLabel = latest
      ? new Date(latest).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "No activity";
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
        id: "hub",
        label: "Hub",
        value: online ? "Connected" : "Offline",
        tone: online ? "good" : "danger",
        icon: statusIcon("hub"),
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

  const activityItems = useActivityItems(allConfigs, history, lastScene);
  const activeItems = useMemo(() => ROOMS.flatMap((room) =>
    [...room.devices, ...(room.switches ?? [])]
      .filter((config) => config.kind !== "lock" && valueForConfig(config) === true)
      .map((config) => ({ config, roomId: room.id, roomName: room.name })),
  ).sort((a, b) => Number(b.config.kind === "light") - Number(a.config.kind === "light")), [dummyOn, liveDevices]);

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

  const renderActiveView = () => {
    if (activeView === "home") {
      return (
        <HomeView
          statusItems={statusItems}
          activityItems={activityItems}
          activeItems={activeItems}
          scenes={SCENES}
          onApplyScene={applyScene}
          onShutdown={handleShutdown}
          shutdownActive={anythingOn}
          onOpenRoom={setOpenRoomId}
        />
      );
    }
    if (activeView === "rooms") {
      return (
        <RoomsView
          dummyOn={dummyOn}
          onDummyToggle={toggleDummy}
          onExpand={setOpenRoomId}
        />
      );
    }
    if (activeView === "scenes")
      return <ScenesView onApplyScene={applyScene} />;
    if (activeView === "security")
      return (
        <SecurityView records={securityRecords} activityItems={activityItems} onShutdown={handleShutdown} shutdownActive={anythingOn} />
      );
    if (activeView === "devices")
      return (
        <DevicesView
          records={deviceRecords}
          readiness={readiness}
          online={online}
        />
      );
    if (activeView === "activity")
      return <ActivityView activityItems={activityItems} />;
    return (
      <SettingsView
        readiness={readiness}
        records={deviceRecords}
        unavailableLiveCount={unavailableLiveCount}
        online={online}
      />
    );
  };

  return (
    <MotionReadiness.Provider value={motionReady}>
    <div className="dash" data-motion-ready={motionReady}>
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
            {online && <><span className="dash-status-dot" aria-hidden="true" />Live home status</>}
          </p>
        </div>
      </header>

      <ConnectionBanner online={online} />

      <nav className="app-nav" aria-label="App sections">
        <div className="nav-brand"><Home size={24} aria-hidden="true" /><span>AL-Mashareq<small>Home control</small></span></div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const mobileHidden = ["devices", "activity", "settings"].includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`app-nav-item${mobileHidden ? " app-nav-item--more" : ""}`}
              data-active={activeView === item.id ? "true" : "false"}
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <div className="more-nav">
          <button type="button" className="app-nav-item more-nav-trigger" data-active={["devices", "activity", "settings"].includes(activeView)} aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}>
            <MoreHorizontal size={20} aria-hidden="true" />
            <span>More</span>
          </button>
          {moreOpen && <div className="more-nav-menu" aria-label="More sections">
            {NAV_ITEMS.filter((item) => ["devices", "activity", "settings"].includes(item.id)).map((item) => {
              const Icon = item.icon;
              return <button type="button" key={item.id} className="app-nav-item" data-active={activeView === item.id ? "true" : "false"} onClick={() => { setActiveView(item.id); setMoreOpen(false); }}><Icon size={18} aria-hidden="true" /><span>{item.label}</span></button>;
            })}
          </div>}
        </div>
        <div className="nav-footer"><span>Appearance</span><ThemeToggle /></div>
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

      <div className="view-stage"><AnimatePresence initial={false} mode="popLayout"><ViewFrame key={activeView}>{renderActiveView()}</ViewFrame></AnimatePresence></div>

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
    </MotionReadiness.Provider>
  );
}
