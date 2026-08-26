import { useEffect } from "react";
import DashboardHeader from "./components/DashboardHeader";
import StatStrip from "./components/StatStrip";
import RoomCard from "./components/RoomCard";
import DeviceRenderer from "./components/DeviceRenderer";
import { ROOMS, totalDevices } from "./rooms";
import { useHomeStore } from "./store/useHomeStore";
import { useThemeStore } from "./store/useThemeStore";

export default function App() {
  const online = useHomeStore((s) => s.online);
  const load = useHomeStore((s) => s.load);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <DashboardHeader online={online} />
      <StatStrip rooms={ROOMS.length} devices={totalDevices(ROOMS)} online={online} />

      <main className="dashboard-main">
        {ROOMS.map((room) => (
          <RoomCard key={room.id} name={room.name} icon={room.icon}>
            {room.devices.map((dev) => (
              <DeviceRenderer key={dev.id} config={dev} />
            ))}
          </RoomCard>
        ))}
      </main>

      <footer className="dashboard-footer">
        Smart Apartment · IoT Control Panel
      </footer>
    </div>
  );
}
