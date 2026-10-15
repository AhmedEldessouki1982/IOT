import { motion, useReducedMotion } from "framer-motion";
import { X, Lightbulb, Lock } from "lucide-react";
import { isToggleableKind, type DeviceConfig } from "../features/devices";
import CardDevice from "../features/devices/CardDevice";
import SwitchCard from "../components/SwitchCard";
import { ROOM_ICON_MAP } from "./RoomCard";
import { BedSingle } from "lucide-react";
import { useHomeStore } from "../store/useHomeStore";
import {
  isLiveConfig,
  liveBooleanValue,
  liveDeviceId,
  liveStateKey,
} from "../features/devices/deviceRuntime";
import { useTimers } from "../hooks/useTimers";
import { markLocalAction } from "../hooks/localActions";

interface RoomDetailProps {
  id: string;
  name: string;
  devices: DeviceConfig[];
  /** Live Sonoff switch relays to show as balanced switch cards. */
  switches?: DeviceConfig[];
  dummyOn: Record<string, boolean>;
  onDummyToggle: (id: string) => void;
  onClose: () => void;
}

/** Room detail with device rows and room-level actions for available kinds. */
export default function RoomDetail({
  id,
  name,
  devices,
  switches = [],
  dummyOn,
  onDummyToggle,
  onClose,
}: RoomDetailProps) {
  const Icon = ROOM_ICON_MAP[id] ?? BedSingle;
  const reducedMotion = useReducedMotion();
  const motionTokens = getComputedStyle(document.documentElement);
  const duration = reducedMotion ? 0 : Number.parseFloat(
    motionTokens.getPropertyValue("--duration-panel"),
  ) / 1000;
  const enterOffset = reducedMotion ? 0 : Number.parseFloat(
    motionTokens.getPropertyValue("--motion-enter"),
  );

  // Live MQTT device states (light1 + sonoff1/2/3) — any light config that
  // carries a deviceId rounds-trips here; the rest are local dummy toggles.
  const liveDevices = useHomeStore((s) => s.devices);
  const setLiveBoolean = useHomeStore((s) => s.setBoolean);
  const timers = useTimers();
  const timerByDeviceId = new Map(
    timers.map((timer) => [timer.deviceId, timer.remainingSeconds]),
  );

  const allLights = [...devices, ...switches].filter((d) => d.kind === "light");
  const lockIds = devices.filter((d) => d.kind === "lock").map((d) => d.id);

  const liveOn = (d: DeviceConfig) => {
    const deviceId = liveDeviceId(d);
    return deviceId
      ? liveBooleanValue(d, liveDevices[deviceId]) === true
      : false;
  };
  const anyLightOn = allLights.some((d) => {
    if (d.kind !== "light") return false;
    if (isLiveConfig(d)) return liveOn(d);
    return dummyOn[d.id] ?? false;
  });
  const anyLockUnlocked = lockIds.some((lid) => !dummyOn[lid]);

  const setAllLights = (on: boolean) => {
    allLights.forEach((d) => {
      markLocalAction(liveDeviceId(d) ?? d.id);
      if (d.kind !== "light") return;
      if (isLiveConfig(d)) {
        const deviceId = liveDeviceId(d);
        if (deviceId && liveOn(d) !== on) {
          void setLiveBoolean(deviceId, liveStateKey(d.kind), on);
        }
        return;
      }
      if ((dummyOn[d.id] ?? false) !== on) onDummyToggle(d.id);
    });
  };
  const setAllLocks = (locked: boolean) => {
    lockIds.forEach((lid) => {
      markLocalAction(lid);
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
      transition={{ duration }}
    >
      <motion.section
        className="room-detail"
        initial={{ opacity: reducedMotion ? 1 : 0, y: enterOffset }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: reducedMotion ? 1 : 0, y: enterOffset }}
        transition={{ duration }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-detail-title"
      >
        <header className="room-detail-head">
          <div className="room-detail-title">
            <span className="room-detail-icon" aria-hidden="true">
              <Icon size={20} strokeWidth={1.6} />
            </span>
            <div>
              <h2 id="room-detail-title">{name}</h2>
              <p className="room-detail-sub">
                {[...devices, ...switches].length} device
                {[...devices, ...switches].length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="room-detail-close"
            onClick={onClose}
            aria-label="Close room detail"
            autoFocus
          >
            <X size={17} strokeWidth={1.8} />
          </button>
        </header>

        {(allLights.length > 0 || lockIds.length > 0) && (
          <div className="room-detail-actions">
            {allLights.length > 0 && (
              <button
                type="button"
                className="room-detail-action"
                onClick={() => setAllLights(!anyLightOn)}
              >
                <Lightbulb size={14} strokeWidth={1.7} />
                {anyLightOn ? "All lights off" : "All lights on"}
              </button>
            )}
            {lockIds.length > 0 && (
              <button
                type="button"
                className="room-detail-action"
                onClick={() => setAllLocks(anyLockUnlocked)}
              >
                <Lock size={14} strokeWidth={1.7} />
                {anyLockUnlocked ? "Lock all" : "Unlock all"}
              </button>
            )}
          </div>
        )}

        {switches.length > 0 && (
          <div className="switch-row">
            {switches.map((sw) => (
              <SwitchCard
                key={sw.id}
                deviceId={(sw as { deviceId?: string }).deviceId!}
                label={sw.label}
                remainingSeconds={timerByDeviceId.get(
                  (sw as { deviceId?: string }).deviceId!,
                )}
              />
            ))}
          </div>
        )}

        <ul className="room-detail-list">
          {devices.map((config) => (
            <li key={config.id} className="room-detail-item">
              <CardDevice
                config={config}
                state={
                  isToggleableKind(config.kind) ? dummyOn[config.id] : undefined
                }
                onToggle={
                  isToggleableKind(config.kind)
                    ? () => onDummyToggle(config.id)
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      </motion.section>
    </motion.div>
  );
}
