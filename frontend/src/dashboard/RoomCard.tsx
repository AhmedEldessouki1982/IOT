import type { DeviceConfig } from "../features/devices";
import CardDevice from "../features/devices/CardDevice";
import {
  Sofa,
  UtensilsCrossed,
  Bath,
  Footprints,
  BedSingle,
  BedDouble,
  Crown,
  Droplets,
} from "lucide-react";
import { useHomeStore } from "../store/useHomeStore";
import type { CSSProperties } from "react";

const ROOM_ICON: Record<string, typeof Sofa> = {
  reception: Sofa,
  kitchen: UtensilsCrossed,
  toilet: Bath,
  corridor: Footprints,
  bed1: BedSingle,
  bed2: BedDouble,
  master: Crown,
  ensuite: Droplets,
};

const ROOM_SPAN: Record<string, string> = {
  reception: "room-card--wide",
  kitchen: "room-card--wide",
  toilet: "room-card--narrow",
  corridor: "room-card--narrow",
  bed1: "room-card--narrow",
  bed2: "room-card--narrow",
  master: "room-card--narrow",
  ensuite: "room-card--narrow",
};

/* Per-room accent — each card glows in its own hue when a light is on,
   a subtle command-center touch without breaking the shared palette. */
const ROOM_ACCENT: Record<string, string> = {
  reception: "#22d3ee",
  kitchen: "#f59e0b",
  toilet: "#60a5fa",
  corridor: "#a78bfa",
  bed1: "#34d399",
  bed2: "#f472b6",
  master: "#c084fc",
  ensuite: "#38bdf8",
};

interface RoomCardProps {
  id: string;
  name: string;
  devices: DeviceConfig[];
  index?: number;
  dummyOn?: Record<string, boolean>;
  onDummyToggle?: (id: string) => void;
}

/** Bento room card — icon + name + meta, warm wash when any light is on. */
export default function RoomCard({ id, name, devices, index = 0, dummyOn, onDummyToggle }: RoomCardProps) {
  const Icon = ROOM_ICON[id] ?? BedSingle;
  const spanClass = ROOM_SPAN[id] ?? "room-card--wide";
  const accent = ROOM_ACCENT[id] ?? "#22d3ee";

  const liveOn = useHomeStore((s) => s.device?.state.on === true);
  const lights = devices.filter((d) => d.kind === "light");
  const lightsOn = lights.filter((d) => {
    if (d.kind !== "light") return false;
    if ((d as { deviceId?: string }).deviceId === "light1") return liveOn;
    return dummyOn?.[d.id] ?? false;
  }).length;
  const hasActiveLight = lightsOn > 0;

  return (
    <section
      className={`room-card ${spanClass}`}
      data-on={hasActiveLight ? "true" : "false"}
      style={{ "--i": index, "--cc-room-accent": accent } as CSSProperties}
    >
      <header className="room-card-head">
        <div className="room-card-title">
          <span className="room-card-icon" aria-hidden="true">
            <Icon size={15} strokeWidth={1.7} />
          </span>
          <h2 className="room-card-name">{name}</h2>
        </div>
        <span className="room-card-meta">
          <span className="room-card-count">
            {devices.length} · {lights.length ? `${lightsOn} on` : "—"}
          </span>
          <span className="room-card-dot" aria-hidden="true" />
        </span>
      </header>
      <ul className="room-card-list">
        {devices.map((config) => (
          <li key={config.id} className="room-card-item">
            <CardDevice
              config={config}
              state={config.kind === "light" ? dummyOn?.[config.id] ?? false : undefined}
              onToggle={config.kind === "light" ? () => onDummyToggle?.(config.id) : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
