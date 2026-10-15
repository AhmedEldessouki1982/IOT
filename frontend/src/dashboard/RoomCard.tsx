import { isToggleableKind, type DeviceConfig } from "../features/devices";
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
  ChevronRight,
} from "lucide-react";
import { useHomeStore } from "../store/useHomeStore";
import { deviceBooleanValue } from "../features/devices/deviceRuntime";
import type { MouseEvent } from "react";
import { useTimers } from "../hooks/useTimers";
import { motion, useReducedMotion } from "framer-motion";
import { motionMs, motionEase } from "../hooks/motionTokens";

const ROOM_ICON: Record<string, typeof Sofa> = {
  reception: Sofa,
  kitchen: UtensilsCrossed,
  toilet: Bath,
  corridor: Footprints,
  bed1: BedSingle,
  bed2: BedDouble,
  master: Crown,
};

export const ROOM_ICON_MAP = ROOM_ICON;

interface RoomCardProps {
  id: string;
  name: string;
  devices: DeviceConfig[];
  /** Live Sonoff switch relays to show as balanced switch cards. */
  switches?: DeviceConfig[];
  dummyOn?: Record<string, boolean>;
  onDummyToggle?: (id: string) => void;
  /** Opens the full-screen room detail view for this room. */
  onExpand?: (id: string) => void;
}

/** Room summary with a warm tint when a light is on. Device controls stop
 *  propagation so opening the detail view never also toggles a device. */
export default function RoomCard({
  id,
  name,
  devices,
  switches = [],
  dummyOn,
  onDummyToggle,
  onExpand,
}: RoomCardProps) {
  const Icon = ROOM_ICON[id] ?? BedSingle;
  const reduced = useReducedMotion();

  // Live MQTT devices map (light1 + sonoff1/2/3) so the card's "on" count
  // reflects real server state for any light that carries a live deviceId.
  const liveDevices = useHomeStore((s) => s.devices);
  const timers = useTimers();
  const timerByDeviceId = new Map(
    timers.map((timer) => [timer.deviceId, timer.remainingSeconds]),
  );
  const allDevices = [...devices, ...switches];
  const valueFor = (config: DeviceConfig) =>
    deviceBooleanValue(config, liveDevices, dummyOn);
  const allLights = allDevices.filter((d) => d.kind === "light");
  const lightsOn = allLights.filter((d) => valueFor(d) === true).length;
  const sensorsSafe = allDevices
    .filter((d) => d.kind === "smoke" || d.kind === "gas-leak")
    .every((d) => valueFor(d) !== true);
  const locksLocked = allDevices
    .filter((d) => d.kind === "lock")
    .every((d) => valueFor(d) !== false);
  const hasActiveLight = lightsOn > 0;
  const previewDevices = devices;

  const stopRowClick = (e: MouseEvent) => e.stopPropagation();

  return (
    <motion.section
      layoutId={reduced ? undefined : `room-card-${id}`}
      transition={{ duration: reduced ? 0 : motionMs("view") / 1000, ease: motionEase() }}
      className="room-card"
      data-on={hasActiveLight ? "true" : "false"}
      onClick={() => onExpand?.(id)}
      role="group"
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
            {allLights.length ? `${lightsOn} of ${allLights.length} lights on` : `${allDevices.length} devices`}
          </span>
          {onExpand && <button type="button" className="room-card-expand" aria-label={`Open ${name} details`} onClick={(event) => { event.stopPropagation(); onExpand(id); }}><ChevronRight size={18} strokeWidth={2} aria-hidden="true" /></button>}
        </span>
      </header>
      {(allDevices.some((d) => ["lock", "smoke", "gas-leak"].includes(d.kind)) || allDevices.some((d) => timerByDeviceId.has("deviceId" in d ? d.deviceId ?? "" : ""))) && <div className="room-card-health" aria-label={`${name} summary`}>
        {allDevices.some((d) => timerByDeviceId.has("deviceId" in d ? d.deviceId ?? "" : "")) && <span>Timer running</span>}
        {allDevices.some((d) => d.kind === "lock") && (
          <span data-state={locksLocked ? "good" : "danger"}>
            {locksLocked ? "Secured" : "Unlocked"}
          </span>
        )}
        {allDevices.some(
          (d) => d.kind === "smoke" || d.kind === "gas-leak",
        ) && (
          <span data-state={sensorsSafe ? "good" : "danger"}>
            {sensorsSafe ? "Sensors safe" : "Sensor alert"}
          </span>
        )}
      </div>}
      {switches.length > 0 && (
        <div className="switch-row" onClick={stopRowClick}>
          {switches.map((sw) => (
            <SwitchCard
              key={sw.id}
              deviceId={(sw as { deviceId?: string }).deviceId!}
              label={sw.label}
              remainingSeconds={timerByDeviceId.get(
                (sw as { deviceId?: string }).deviceId!,
              )}
              durationSeconds={timers.find(t => t.deviceId === (sw as {deviceId?: string}).deviceId)?.durationSeconds}
              expiresAt={timers.find(t => t.deviceId === (sw as {deviceId?: string}).deviceId)?.expiresAt}
            />
          ))}
        </div>
      )}
      <ul className="room-card-list">
        {previewDevices.map((config) => (
          <li key={config.id} className="room-card-item" onClick={stopRowClick}>
            <CardDevice
              config={config}
              state={
                isToggleableKind(config.kind) ? dummyOn?.[config.id] : undefined
              }
              onToggle={
                isToggleableKind(config.kind)
                  ? () => onDummyToggle?.(config.id)
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
