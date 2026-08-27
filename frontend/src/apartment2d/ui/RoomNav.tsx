import { useMemo } from "react";
import type { DevicePlacement } from "../types";
import { useDeviceStore } from "../store/useDeviceStore";
import { defaultStateFor } from "../deviceDefaults";

interface RoomNavProps {
  /** null = overview */
  activeId: string | null;
  onChange: (id: string | null) => void;
  rooms: Array<{ id: string; name: string }>;
  devices: DevicePlacement[];
}

const ACTIVATABLE = new Set(["ceilingLight", "lamp", "ac", "tv", "lock"]);

export function RoomNav({ activeId, onChange, rooms, devices }: RoomNavProps) {
  const states = useDeviceStore((s) => s.states);

  const perRoom = useMemo(() => {
    const map = new Map<string, { total: number; on: number }>();
    for (const room of rooms) map.set(room.id, { total: 0, on: 0 });
    for (const d of devices) {
      const entry = map.get(d.roomId);
      if (!entry) continue;
      entry.total += 1;
      if (ACTIVATABLE.has(d.kind)) {
        const merged = { ...defaultStateFor(d.kind), ...(states[d.deviceId]?.state ?? {}) };
        if (merged.on || merged.locked === false) entry.on += 1;
      }
    }
    return map;
  }, [states, rooms, devices]);

  return (
    <nav className="apt-roomnav">
      <button
        type="button"
        className="apt-roomnav-item"
        data-active={activeId === null}
        onClick={() => onChange(null)}
      >
        OVERVIEW
      </button>
      {rooms.map((room) => {
        const stat = perRoom.get(room.id)!;
        return (
          <button
            key={room.id}
            type="button"
            className="apt-roomnav-item"
            data-active={activeId === room.id}
            onClick={() => onChange(room.id)}
          >
            <span>{room.name.toUpperCase()}</span>
            <span className="apt-roomnav-meta">
              <i data-any-on={stat.on > 0} />
              {stat.total}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
