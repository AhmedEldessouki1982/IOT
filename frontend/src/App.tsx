import { useEffect, useMemo, useState } from "react";
import { useHomeStore } from "./store/useHomeStore";
import { useDummyLights } from "./features/devices/useDummyLights";
import { ROOMS } from "./dashboard/rooms";
import RoomCard from "./dashboard/RoomCard";
import ThemeToggle from "./components/ThemeToggle";
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
  const { time, date } = useClock();

  const dummyIds = useMemo(
    () => ROOMS.flatMap((r) => r.devices).filter((d) => d.kind === "light" && !d.deviceId).map((d) => d.id),
    [],
  );
  const { states: dummyOn, toggle: toggleDummy } = useDummyLights(dummyIds);

  useEffect(() => {
    homeLoad();
  }, [homeLoad]);

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
          <span className="dash-summary">{ROOMS.length} rooms · {ROOMS.reduce((a, r) => a + r.devices.length, 0)} devices</span>
        </span>
      </header>

      <main className="dash-grid">
        {ROOMS.map((room, i) => (
          <RoomCard
            key={room.id}
            id={room.id}
            name={room.name}
            devices={room.devices}
            index={i}
            dummyOn={dummyOn}
            onDummyToggle={toggleDummy}
          />
        ))}
      </main>
    </div>
  );
}
