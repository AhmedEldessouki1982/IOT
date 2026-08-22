import { useEffect, useMemo, useState } from "react";
import { DEVICES, OVERVIEW_VIEW, ROOMS } from "./config/apartment";
import { useDeviceStore } from "./store/useDeviceStore";
import { useThemeStore } from "../store/useThemeStore";
import { ApartmentScene } from "./three/scene/ApartmentScene";
import type { ScenePose } from "./three/scene/ApartmentScene";
import { TopBar } from "./ui/TopBar";
import { RoomNav } from "./ui/RoomNav";
import { DevicePanel } from "./ui/DevicePanel";
import "./apartment.css";

export default function ApartmentPage() {
  const theme = useThemeStore((s) => s.theme);
  const online = useDeviceStore((s) => s.online);
  const load = useDeviceStore((s) => s.load);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => DEVICES.find((d) => d.deviceId === selectedId) ?? null,
    [selectedId],
  );

  /** camera pose: selected device > focused room > overview */
  const pose: ScenePose = useMemo(() => {
    if (selected) {
      const [x, y, z] = selected.position;
      const len = Math.hypot(x, z);
      const dx = len < 0.01 ? 0.71 : x / len;
      const dz = len < 0.01 ? 0.71 : z / len;
      return {
        position: [x + dx * 4.6, y + 2.4, z + dz * 4.6],
        target: [x, y, z],
      };
    }
    if (!roomId) return OVERVIEW_VIEW;
    return ROOMS.find((r) => r.id === roomId)?.view ?? OVERVIEW_VIEW;
  }, [selected, roomId]);

  return (
    <div className="apt-root">
      <TopBar online={online} />

      <div className="apt-canvas-wrap">
        <ApartmentScene
          theme={theme}
          pose={pose}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onClearSelection={() => setSelectedId(null)}
        />
      </div>

      <RoomNav
        activeId={roomId}
        onChange={(id) => {
          setSelectedId(null);
          setRoomId(id);
        }}
      />

      {selected && (
        <DevicePanel deviceId={selected.deviceId} onClose={() => setSelectedId(null)} />
      )}

      {!online && (
        <div className="apt-offline-strip">BACKEND OFFLINE — SHOWING DEFAULT DEVICE STATES</div>
      )}
    </div>
  );
}
