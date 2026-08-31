import { motion } from "framer-motion";
import { X, Lightbulb, Lock } from "lucide-react";
import type { CSSProperties } from "react";
import type { DeviceConfig } from "../features/devices";
import CardDevice from "../features/devices/CardDevice";
import { ROOM_ICON_MAP, ROOM_ACCENT_MAP } from "./RoomCard";
import { BedSingle } from "lucide-react";
import { useHomeStore } from "../store/useHomeStore";

interface RoomDetailProps {
  id: string;
  name: string;
  devices: DeviceConfig[];
  dummyOn: Record<string, boolean>;
  onDummyToggle: (id: string) => void;
  onClose: () => void;
}

/** Full room drill-in — same device rows as the bento card, larger, plus
 *  room-level quick actions (all lights, all locks) that only appear when
 *  the room actually has that kind of device. Shares `layoutId` with its
 *  RoomCard so the open/close reads as one continuous surface. */
export default function RoomDetail({ id, name, devices, dummyOn, onDummyToggle, onClose }: RoomDetailProps) {
  const Icon = ROOM_ICON_MAP[id] ?? BedSingle;
  const accent = ROOM_ACCENT_MAP[id] ?? "#22d3ee";

  const liveOn = useHomeStore((s) => s.device?.state.on === true);
  const liveToggle = useHomeStore((s) => s.toggle);

  const lightIds = devices.filter((d) => d.kind === "light").map((d) => d.id);
  const lockIds = devices.filter((d) => d.kind === "lock").map((d) => d.id);

  const isLiveLight = (deviceId: string) => deviceId === "light1";
  const anyLightOn = devices.some((d) => {
    if (d.kind !== "light") return false;
    if (d.deviceId && isLiveLight(d.deviceId)) return liveOn;
    return dummyOn[d.id] ?? false;
  });
  const anyLockUnlocked = lockIds.some((lid) => !dummyOn[lid]);

  const setAllLights = (on: boolean) => {
    devices.forEach((d) => {
      if (d.kind !== "light") return;
      if (d.deviceId && isLiveLight(d.deviceId)) {
        if (liveOn !== on) liveToggle();
        return;
      }
      if ((dummyOn[d.id] ?? false) !== on) onDummyToggle(d.id);
    });
  };
  const setAllLocks = (locked: boolean) => {
    lockIds.forEach((lid) => {
      if ((dummyOn[lid] ?? true) !== locked) onDummyToggle(lid);
    });
  };

  return (
    <motion.div
      className="room-detail-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.section
        layoutId={`room-card-${id}`}
        className="room-detail"
        style={{ "--cc-room-accent": accent } as CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="room-detail-head">
          <div className="room-detail-title">
            <span className="room-detail-icon" aria-hidden="true">
              <Icon size={20} strokeWidth={1.6} />
            </span>
            <div>
              <h2>{name}</h2>
              <p className="room-detail-sub">{devices.length} device{devices.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          <button type="button" className="room-detail-close" onClick={onClose} aria-label="Close room detail">
            <X size={17} strokeWidth={1.8} />
          </button>
        </header>

        {(lightIds.length > 0 || lockIds.length > 0) && (
          <div className="room-detail-actions">
            {lightIds.length > 0 && (
              <button type="button" className="room-detail-action" onClick={() => setAllLights(!anyLightOn)}>
                <Lightbulb size={14} strokeWidth={1.7} />
                {anyLightOn ? "All lights off" : "All lights on"}
              </button>
            )}
            {lockIds.length > 0 && (
              <button type="button" className="room-detail-action" onClick={() => setAllLocks(anyLockUnlocked)}>
                <Lock size={14} strokeWidth={1.7} />
                {anyLockUnlocked ? "Lock all" : "Unlock all"}
              </button>
            )}
          </div>
        )}

        <ul className="room-detail-list">
          {devices.map((config) => (
            <li key={config.id} className="room-detail-item">
              <CardDevice
                config={config}
                state={config.kind === "light" || config.kind === "lock" ? dummyOn[config.id] : undefined}
                onToggle={
                  config.kind === "light" || config.kind === "lock" ? () => onDummyToggle(config.id) : undefined
                }
              />
            </li>
          ))}
        </ul>
      </motion.section>
    </motion.div>
  );
}
