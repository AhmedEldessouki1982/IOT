import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useHomeStore } from "./store/useHomeStore";
import { useDummyToggles } from "./features/devices/useDummyToggles";
import { ROOMS } from "./dashboard/rooms";
import RoomCard from "./dashboard/RoomCard";
import RoomDetail from "./dashboard/RoomDetail";
import ThemeToggle from "./components/ThemeToggle";
import EmergencyShutdown from "./components/EmergencyShutdown";
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
  const homeLoad = useHomeStore((s) => s.load);
  // Live MQTT devices (light1 + sonoff1/2/3) that are currently ON — used to
  // arm the emergency shutdown and to flip everything off at once.
  const liveDevices = useHomeStore((s) => s.devices);
  const liveToggle = useHomeStore((s) => s.toggle);
  const anyLiveOn = Object.values(liveDevices).some((d) => d.state.on === true);
  const { time, date } = useClock();
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);

  // Non-live lights default off; locks default locked — each dummy device
  // seeds its own starting value instead of one blanket default.
  const dummyInitial = useMemo(() => {
    const initial: Record<string, boolean> = {};
    let firstDummyLightSeen = false;
    ROOMS.flatMap((r) => r.devices).forEach((d) => {
      if (d.kind === "light" && !d.deviceId) {
        // first dummy light on for a warm, occupied look; rest start off
        initial[d.id] = !firstDummyLightSeen;
        firstDummyLightSeen = true;
      }
      if (d.kind === "lock") initial[d.id] = d.locked ?? true;
    });
    return initial;
  }, []);
  const { states: dummyOn, toggle: toggleDummy, reset: resetDummy } = useDummyToggles(dummyInitial);

  // Emergency shutdown: everything off — every live MQTT device off
  // (light1 + sonoff relays), every dummy light off, and every door lock
  // locked. `shutdownActive` reflects whether anything is currently on /
  // unlocked so the button can state itself.
  const anythingOn = useMemo(() => {
    if (anyLiveOn) return true;
    return ROOMS.flatMap((r) => r.devices).some((d) => {
      if (d.kind === "lock") return (dummyOn[d.id] ?? true) === false;
      if (d.kind === "light" && !d.deviceId) return dummyOn[d.id] ?? false;
      return false;
    });
  }, [anyLiveOn, dummyOn]);

  const handleShutdown = () => {
    // Turn off every live MQTT device that's currently on.
    Object.values(liveDevices).forEach((d) => {
      if (d.state.on === true) void liveToggle(d.deviceId);
    });
    const next: Record<string, boolean> = {};
    ROOMS.flatMap((r) => r.devices).forEach((d) => {
      if (d.kind === "light" && !d.deviceId) next[d.id] = false;
      if (d.kind === "lock") next[d.id] = true;
    });
    resetDummy(next);
  };

  useEffect(() => {
    homeLoad();
    // Seed the Sonoff 3-gang relays too (sonoff1/2/3) so their cards show
    // real state even before the first socket broadcast arrives.
    ["sonoff1", "sonoff2", "sonoff3"].forEach((id) => homeLoad(id));
  }, [homeLoad]);

  const openRoom = openRoomId ? ROOMS.find((r) => r.id === openRoomId) ?? null : null;

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
          <ThemeToggle />
          <EmergencyShutdown onShutdown={handleShutdown} active={anythingOn} />
          <span className="dash-summary">{ROOMS.length} rooms · {ROOMS.reduce((a, r) => a + r.devices.length + (r.switches?.length ?? 0), 0)} devices</span>
        </span>
      </header>

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
