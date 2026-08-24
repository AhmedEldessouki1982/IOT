import { useEffect, useState } from "react";
import { DEVICES_2D, ROOMS_2D } from "./config/apartment";
import { useDeviceStore } from "../apartment/store/useDeviceStore";
import { useThemeStore } from "../store/useThemeStore";
import type { TimeOfDay } from "../apartment/types";
import { TopBar } from "../apartment/ui/TopBar";
import { RoomNav } from "../apartment/ui/RoomNav";
import { DevicePanel } from "../apartment/ui/DevicePanel";
import { Splash } from "../apartment/ui/Splash";
import { HintToast } from "../apartment/ui/HintToast";
import { Floorplan } from "./Floorplan";
import "./../apartment/apartment.css";
import "./apartment2d.css";

const TOD_KEY = "apt-time-of-day";

function loadTimeOfDay(): TimeOfDay {
  return localStorage.getItem(TOD_KEY) === "night" ? "night" : "day";
}

export default function Apartment2DPage() {
  const theme = useThemeStore((s) => s.theme);
  const online = useDeviceStore((s) => s.online);
  const load = useDeviceStore((s) => s.load);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(loadTimeOfDay);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    load();
    const t = window.setTimeout(() => setBooted(true), 650);
    return () => window.clearTimeout(t);
  }, [load]);

  const changeTimeOfDay = (t: TimeOfDay) => {
    setTimeOfDay(t);
    localStorage.setItem(TOD_KEY, t);
  };

  return (
    <div className="apt-root fp-root" data-tod={timeOfDay}>
      <Splash ready={booted} sub="INITIALIZING FLOORPLAN" />

      <TopBar
        online={online}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={changeTimeOfDay}
        title="SMART APARTMENT · FLOORPLAN"
        deviceCount={DEVICES_2D.length}
      />

      <div className="apt-canvas-wrap fp-stage">
        <Floorplan
          selectedId={selectedId}
          focusedRoomId={roomId}
          onSelect={setSelectedId}
          onRoomFocus={setRoomId}
        />
      </div>

      <RoomNav
        activeId={roomId}
        onChange={(id) => {
          setSelectedId(null);
          setRoomId(id);
        }}
        rooms={ROOMS_2D}
        devices={DEVICES_2D}
      />

      {booted && <HintToast text="CLICK ANY DEVICE TO CONTROL IT · CLICK A ROOM TO FOCUS" />}

      {selectedId && (
        <DevicePanel
          deviceId={selectedId}
          placements={DEVICES_2D}
          rooms={ROOMS_2D}
          onClose={() => setSelectedId(null)}
        />
      )}

      {!online && booted && (
        <div className="apt-offline-strip">BACKEND OFFLINE — SHOWING DEFAULT DEVICE STATES</div>
      )}
    </div>
  );
}
