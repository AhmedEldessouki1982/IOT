import type { DeviceConfig } from "../features/devices";
import CardDevice from "../features/devices/CardDevice";
import SwitchCard from "../components/SwitchCard";
import {
  Sofa,
  UtensilsCrossed,
  Bath,
  Footprints,
  BedSingle,
  BedDouble,
  Crown,
  Droplets,
  ChevronRight,
} from "lucide-react";
import { useHomeStore } from "../store/useHomeStore";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { motion } from "framer-motion";

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

export const ROOM_ICON_MAP = ROOM_ICON;
export const ROOM_ACCENT_MAP = ROOM_ACCENT;

interface RoomCardProps {
  id: string;
  name: string;
  devices: DeviceConfig[];
  /** Live Sonoff switch relays to show as balanced switch cards. */
  switches?: DeviceConfig[];
  /** Grid span class for the bento card (defaults to wide). */
  span?: string;
  index?: number;
  dummyOn?: Record<string, boolean>;
  onDummyToggle?: (id: string) => void;
  /** Opens the full-screen room detail view for this room. */
  onExpand?: (id: string) => void;
}

/** Bento room card — icon + name + meta, warm wash when any light is on.
 *  Live Sonoff relays render as a balanced switch-card row; the rest as the
 *  usual compact device list. Clicking the card (anywhere but a device control)
 *  opens the room detail view; `layoutId` gives that transition a shared-element
 *  feel. */
export default function RoomCard({ id, name, devices, switches = [], span, index = 0, dummyOn, onDummyToggle, onExpand }: RoomCardProps) {
  const Icon = ROOM_ICON[id] ?? BedSingle;
  const spanClass = span ?? ROOM_SPAN[id] ?? "room-card--wide";
  const accent = ROOM_ACCENT[id] ?? "#22d3ee";

  // Live MQTT devices map (light1 + sonoff1/2/3) so the card's "on" count
  // reflects real server state for any light that carries a live deviceId.
  const liveDevices = useHomeStore((s) => s.devices);
  const allLights = [...devices, ...switches].filter((d) => d.kind === "light");
  const lightsOn = allLights.filter((d) => {
    if (d.kind !== "light") return false;
    const deviceId = (d as { deviceId?: string }).deviceId;
    if (deviceId) return liveDevices[deviceId]?.state.on === true;
    return dummyOn?.[d.id] ?? false;
  }).length;
  const hasActiveLight = lightsOn > 0;

  const stopRowClick = (e: MouseEvent) => e.stopPropagation();

  const handleCardKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onExpand?.(id);
    }
  };

  return (
    <motion.section
      layoutId={`room-card-${id}`}
      className={`room-card ${spanClass}`}
      data-on={hasActiveLight ? "true" : "false"}
      style={{ "--i": index, "--cc-room-accent": accent } as CSSProperties}
      onClick={() => onExpand?.(id)}
      onKeyDown={handleCardKeyDown}
      role={onExpand ? "button" : undefined}
      tabIndex={onExpand ? 0 : undefined}
      aria-label={onExpand ? `Open ${name} details` : undefined}
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
            {devices.length} · {allLights.length ? `${lightsOn} on` : "—"}
          </span>
          <span className="room-card-dot" aria-hidden="true" />
          <ChevronRight size={13} strokeWidth={2} className="room-card-expand-hint" aria-hidden="true" />
        </span>
      </header>
      {switches.length > 0 && (
        <div className="switch-row" onClick={stopRowClick}>
          {switches.map((sw) => (
            <SwitchCard
              key={sw.id}
              deviceId={(sw as { deviceId?: string }).deviceId!}
              label={sw.label}
            />
          ))}
        </div>
      )}
      <ul className="room-card-list">
        {devices.map((config) => (
          <li key={config.id} className="room-card-item" onClick={stopRowClick}>
            <CardDevice
              config={config}
              state={config.kind === "light" || config.kind === "lock" ? dummyOn?.[config.id] : undefined}
              onToggle={
                config.kind === "light" || config.kind === "lock" ? () => onDummyToggle?.(config.id) : undefined
              }
            />
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
