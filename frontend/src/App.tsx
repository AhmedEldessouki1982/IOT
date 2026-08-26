import { useEffect } from "react";
import {
  Lightbulb,
  Fan,
  Thermometer,
  DoorClosed,
  UtensilsCrossed,
  Bath,
  BedDouble,
  LayoutGrid,
  Cpu,
  Radio,
  Map,
  Flame,
} from "lucide-react";
import DashboardHeader from "./components/DashboardHeader";
import RoomContainer from "./components/RoomContainer";
import DeviceToggle from "./components/DeviceToggle";
import TempSensorReadout from "./components/TempSensorReadout";
import GasLeakSensor from "./components/GasLeakSensor";
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

      <div className="stat-strip">
        <span className="stat-chip">
          <span className="stat-chip-icon"><LayoutGrid size={13} strokeWidth={1.5} /></span>
          <span className="stat-chip-value">4</span> Rooms
        </span>
        <span className="stat-chip">
          <span className="stat-chip-icon"><Cpu size={13} strokeWidth={1.5} /></span>
          <span className="stat-chip-value">9</span> Devices
        </span>
        <span className="stat-chip">
          <span className="stat-chip-icon"><Radio size={13} strokeWidth={1.5} /></span>
          <span className="stat-chip-value">{online ? "1" : "0"}</span> Live
        </span>
        <span className="stat-strip-spacer" />
        <a href="/2d" className="floorplan-btn">
          <Map size={13} strokeWidth={2} />
          Floorplan
        </a>
      </div>

      <main className="dashboard-main">
        <RoomContainer
          name="Reception"
          icon={<DoorClosed size={16} strokeWidth={1.5} />}
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
          icon={<UtensilsCrossed size={16} strokeWidth={1.5} />}
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
          <DeviceToggle
            label="Lamp"
            icon={<Lightbulb size={15} strokeWidth={1.5} />}
          />
          <GasLeakSensor
            icon={<Flame size={15} strokeWidth={1.5} />}
          />
        </RoomContainer>

        <RoomContainer
          name="Bathroom"
          icon={<Bath size={16} strokeWidth={1.5} />}
        >
          <DeviceToggle
            label="Light"
            icon={<Lightbulb size={15} strokeWidth={1.5} />}
          />
        </RoomContainer>

        <RoomContainer
          name="Master Bedroom"
          icon={<BedDouble size={16} strokeWidth={1.5} />}
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
        Smart Apartment &middot; IoT Control Panel
      </footer>
    </div>
  );
}
