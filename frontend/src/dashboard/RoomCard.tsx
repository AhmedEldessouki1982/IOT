import { isToggleableKind, type DeviceConfig } from "../features/devices";
import CardDevice from "../features/devices/CardDevice";
import { RoutineSwitchRow } from "../features/routines";
import {
  Sofa,
  UtensilsCrossed,
  Bath,
  Footprints,
  BedSingle,
  Crown,
  Venus,
  Mars,
  ChevronRight,
} from "lucide-react";
import { useHomeStore } from "../store/useHomeStore";
import { deviceBooleanValue } from "../features/devices/deviceRuntime";
import type { MouseEvent } from "react";
import { useTimers } from "../hooks/useTimers";
import { motion, useReducedMotion } from "framer-motion";
import { motionMs, motionEase } from "../hooks/motionTokens";
import type { Room } from "./rooms";

const ROOM_ICON: Record<string, typeof Sofa> = {
  reception: Sofa,
  kitchen: UtensilsCrossed,
  toilet: Bath,
  "toilet-master": Bath,
  corridor: Footprints,
  master: Crown,
  // lucide ships no literal "Girl" glyph — the Venus symbol (♀) is the female
  // marker used for the Girl Room card.
  girlRoom: Venus,
  // The boy's room counterpart to the Girl Room's Venus (♀) marker.
  omarRoom: Mars,
};

export const ROOM_ICON_MAP = ROOM_ICON;

interface RoomCardProps {
  id: string;
  name: string;
  devices: DeviceConfig[];
  /** Live Sonoff switch relays to show as balanced switch cards. */
  switches?: DeviceConfig[];
  /** Backend routine id — renders the reusable RoutinePanel when set. */
  routineId?: string;
  /** Rooms rendered as these, inside this card (e.g. a toilet in a suite). */
  nested?: Room[];
  /** Nested-card styling; set automatically when rendered inside another card. */
  inset?: boolean;
  dummyOn?: Record<string, boolean>;
  onDummyToggle?: (id: string) => void;
  /** Opens the full-screen room detail view for this room. */
  onExpand?: (id: string) => void;
}

/** Room summary with a warm tint when a light is on. Device controls stop
 *  propagation so opening the detail view never also toggles a device.
 *
 *  A room can contain nested rooms (see `nested`), rendered by reusing this
 *  very component — the same card, one level in. */
export default function RoomCard({
  id,
  name,
  devices,
  switches = [],
  routineId,
  nested = [],
  inset = false,
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
  // Nested rooms count towards this card's summary — the master toilet is part
  // of the master suite, so its lights warm the suite's card too.
  const nestedDevices = nested.flatMap((room) => [
    ...room.devices,
    ...(room.switches ?? []),
  ]);
  const allDevices = [...devices, ...switches, ...nestedDevices];
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
      data-inset={inset ? "true" : "false"}
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
      <RoutineSwitchRow roomId={routineId} switches={switches} stopPropagation />
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
      {nested.length > 0 && (
        <div className="room-card-nested" onClick={stopRowClick}>
          {nested.map((room) => (
            <RoomCard
              key={room.id}
              inset
              id={room.id}
              name={room.name}
              devices={room.devices}
              switches={room.switches}
              routineId={room.routineId}
              nested={room.nested}
              dummyOn={dummyOn}
              onDummyToggle={onDummyToggle}
              onExpand={onExpand}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}
