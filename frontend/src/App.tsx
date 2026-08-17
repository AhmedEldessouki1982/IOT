import { useEffect } from "react";
import DashboardHeader from "./components/DashboardHeader";
import RoomContainer from "./components/RoomContainer";
import DeviceToggle from "./components/DeviceToggle";
import TempSensorReadout from "./components/TempSensorReadout";
import { useLightStore } from "./store/useLightStore";

const log = (label: string) => (on: boolean) => {
  console.log(`[home-control] ${label} ->`, on ? "ON" : "OFF");
};

export default function App() {
  const light = useLightStore((s) => s.light);
  const online = useLightStore((s) => s.online);
  const load = useLightStore((s) => s.load);
  const toggle = useLightStore((s) => s.toggle);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative min-h-screen">
      <div className="scanlines" aria-hidden="true" />
      <DashboardHeader online={online} />

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-5 p-6 md:grid-cols-2">
        <RoomContainer name="Reception" accent="green" index={0}>
          <DeviceToggle
            label="Main Light"
            state={light?.state === "on"}
            onToggle={toggle}
          />
          <TempSensorReadout label="Temp" value={24.5} unit="°C" />
        </RoomContainer>

        <RoomContainer name="Dining Area" accent="amber" index={1}>
          <DeviceToggle label="Ceiling Light" onToggle={log("Ceiling Light")} />
          <DeviceToggle label="Pendant Light" defaultState onToggle={log("Pendant Light")} />
        </RoomContainer>

        <RoomContainer name="Toilet" accent="green" index={2}>
          <DeviceToggle label="Light" onToggle={log("Light")} />
        </RoomContainer>

        <RoomContainer name="Master Room" accent="amber" index={3}>
          <DeviceToggle label="Main Light" onToggle={log("Master Main Light")} />
          <DeviceToggle label="Reading Lamp" onToggle={log("Reading Lamp")} />
          <DeviceToggle label="AC Unit" defaultState onToggle={log("AC Unit")} />
        </RoomContainer>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-8 text-[0.65rem] tracking-wider text-term-muted">
        <span className="text-term-green">❯</span> 4 rooms · 7 devices · reception main light live
        <span className="ml-2 text-term-amber">(other switches demo only)</span>
      </footer>
    </div>
  );
}