import { useEffect } from "react";
import {
  Lightbulb,
  Fan,
  Thermometer,
  DoorClosed,
  UtensilsCrossed,
  Bath,
  BedDouble,
} from "lucide-react";
import DashboardHeader from "./components/DashboardHeader";
import RoomContainer from "./components/RoomContainer";
import DeviceToggle from "./components/DeviceToggle";
import TempSensorReadout from "./components/TempSensorReadout";
import { useHomeStore } from "./store/useHomeStore";
import { useThemeStore } from "./store/useThemeStore";

export default function App() {
  const device = useHomeStore((s) => s.device);
  const online = useHomeStore((s) => s.online);
  const load = useHomeStore((s) => s.load);
  const toggle = useHomeStore((s) => s.toggle);

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

      <main className="dashboard-main">
        <RoomContainer
          name="Reception"
          icon={<DoorClosed size={15} strokeWidth={1.5} />}
        >
          <DeviceToggle
            label="Main Light"
            state={device?.state.on === true}
            onToggle={toggle}
            icon={<Lightbulb size={15} strokeWidth={1.5} />}
          />
          <TempSensorReadout
            label="Temperature"
            value={24.5}
            unit="°C"
            icon={<Thermometer size={15} strokeWidth={1.5} />}
          />
        </RoomContainer>

        <RoomContainer
          name="Dining Area"
          icon={<UtensilsCrossed size={15} strokeWidth={1.5} />}
        >
          <DeviceToggle
            label="Ceiling Light"
            icon={<Lightbulb size={15} strokeWidth={1.5} />}
          />
          <DeviceToggle
            label="Pendant Light"
            defaultState
            icon={<Lightbulb size={15} strokeWidth={1.5} />}
          />
        </RoomContainer>

        <RoomContainer
          name="Bathroom"
          icon={<Bath size={15} strokeWidth={1.5} />}
        >
          <DeviceToggle
            label="Light"
            icon={<Lightbulb size={15} strokeWidth={1.5} />}
          />
        </RoomContainer>

        <RoomContainer
          name="Master Bedroom"
          icon={<BedDouble size={15} strokeWidth={1.5} />}
        >
          <DeviceToggle
            label="Main Light"
            icon={<Lightbulb size={15} strokeWidth={1.5} />}
          />
          <DeviceToggle
            label="AC Unit"
            defaultState
            icon={<Fan size={15} strokeWidth={1.5} />}
          />
        </RoomContainer>
      </main>

      <footer className="dashboard-footer">
        4 rooms &middot; 7 devices &middot;{" "}
        <a href="/2d">Open floorplan &rarr;</a>
      </footer>
    </div>
  );
}
