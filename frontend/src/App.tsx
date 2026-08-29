import { useEffect, useMemo } from "react";
import { useHomeStore } from "./store/useHomeStore";
import { useDummyLights } from "./features/devices/useDummyLights";
import { ROOMS } from "./dashboard/rooms";
import RoomCard from "./dashboard/RoomCard";
import "./index.css";

/** Single-page card dashboard — no theme toggle, no scenes, no floorplan. */
export default function App() {
  const online = useHomeStore((s) => s.online);
  const homeLoad = useHomeStore((s) => s.load);

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
          <h1>Hi, Ahmed</h1>
          <p className={online ? "ok" : "off"} data-online={online}>
            <span className="dash-status-dot" />
            {online ? "All systems OK" : "Offline"}
          </p>
        </div>
        <span className="dash-summary">
          {ROOMS.length} rooms
        </span>
      </header>

      <main className="dash-grid">
        {ROOMS.map((room) => (
          <RoomCard
            key={room.id}
            name={room.name}
            devices={room.devices}
            dummyOn={dummyOn}
            onDummyToggle={toggleDummy}
          />
        ))}
      </main>
    </div>
  );
}
