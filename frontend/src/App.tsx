import { useEffect } from "react";
import {
  Lightbulb,
  Lamp,
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
import { useLightStore } from "./store/useLightStore";
import { useThemeStore } from "./store/useThemeStore";

const log = (label: string) => (on: boolean) => {
  console.log(`[home-control] ${label} ->`, on ? "ON" : "OFF");
};

const RECEPTION_ART = [
  "┌──────────────────┐",
  "│ ░ ░ ░ ░ ░ ░ ░ ░  │",
  "│        ●         │",
  "│                  │",
  "│  ┌────────────┐  │",
  "│  │ ▓ ▓ ▓ ▓ ▓ ▓ │  │",
  "│  └────────────┘  │",
  "└──────────────────┘",
].join("\n");

const DINING_ART = [
  "┌──────────────────┐",
  "│      ●      ●    │",
  "│   ────────────   │",
  "│ ██ ███ ███ ███ ██ │",
  "│  ▐█  ██  ██  ██▌ │",
  "│                  │",
  "└──────────────────┘",
].join("\n");

const TOILET_ART = [
  "┌──────────────────┐",
  "│        ●         │",
  "│                  │",
  "│   ┌────┐   ░░    │",
  "│   │ ▓▓ │   ░░    │",
  "│   └────┘   ░░    │",
  "└──────────────────┘",
].join("\n");

const MASTER_ART = [
  "┌──────────────────┐",
  "│  ●          ●    │",
  "│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │",
  "│                  │",
  "│ ┌──────────────┐ │",
  "│ │ ████████████ │ │",
  "│ └──────────────┘ │",
  "└──────────────────┘",
].join("\n");

export default function App() {
  const light = useLightStore((s) => s.light);
  const online = useLightStore((s) => s.online);
  const load = useLightStore((s) => s.load);
  const toggle = useLightStore((s) => s.toggle);

  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative min-h-screen">
      <div className="scanlines" aria-hidden="true" />
      <DashboardHeader online={online} />

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 lg:p-8 md:grid-cols-2">
        <RoomContainer
          name="Reception"
          accent="green"
          index={0}
          icon={<DoorClosed size={14} strokeWidth={1.5} />}
          art={RECEPTION_ART}
        >
          <DeviceToggle
            label="Main Light"
            state={light?.state === "on"}
            onToggle={toggle}
            icon={<Lightbulb size={14} strokeWidth={1.5} />}
          />
          <TempSensorReadout
            label="Temp"
            value={24.5}
            unit="°C"
            icon={<Thermometer size={14} strokeWidth={1.5} />}
          />
        </RoomContainer>

        <RoomContainer
          name="Dining Area"
          accent="amber"
          index={1}
          icon={<UtensilsCrossed size={14} strokeWidth={1.5} />}
          art={DINING_ART}
        >
          <DeviceToggle
            label="Ceiling Light"
            onToggle={log("Ceiling Light")}
            icon={<Lightbulb size={14} strokeWidth={1.5} />}
          />
          <DeviceToggle
            label="Pendant Light"
            defaultState
            onToggle={log("Pendant Light")}
            icon={<Lamp size={14} strokeWidth={1.5} />}
          />
        </RoomContainer>

        <RoomContainer
          name="Toilet"
          accent="green"
          index={2}
          icon={<Bath size={14} strokeWidth={1.5} />}
          art={TOILET_ART}
        >
          <DeviceToggle
            label="Light"
            onToggle={log("Light")}
            icon={<Lightbulb size={14} strokeWidth={1.5} />}
          />
        </RoomContainer>

        <RoomContainer
          name="Master Room"
          accent="amber"
          index={3}
          icon={<BedDouble size={14} strokeWidth={1.5} />}
          art={MASTER_ART}
        >
          <DeviceToggle
            label="Main Light"
            onToggle={log("Master Main Light")}
            icon={<Lightbulb size={14} strokeWidth={1.5} />}
          />
          <DeviceToggle
            label="Reading Lamp"
            onToggle={log("Reading Lamp")}
            icon={<Lamp size={14} strokeWidth={1.5} />}
          />
          <DeviceToggle
            label="AC Unit"
            defaultState
            onToggle={log("AC Unit")}
            icon={<Fan size={14} strokeWidth={1.5} />}
          />
        </RoomContainer>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-[0.65rem] tracking-wider text-term-muted">
        <span className="text-term-green">❯</span> 4 rooms · 7 devices · reception main light live
        <span className="ml-2 text-term-amber">(other switches demo only)</span>
      </footer>
    </div>
  );
}