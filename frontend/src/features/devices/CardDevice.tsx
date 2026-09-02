import { useHomeStore } from "../../store/useHomeStore";
import type { DeviceConfig } from "./deviceKinds";
import { deviceIcon } from "./deviceKinds";
import { Device, type DeviceProps } from "./index";

interface CardDeviceProps {
  config: DeviceConfig;
  /** external state override for non-live (dummy) lights — shared local state */
  state?: boolean;
  onToggle?: (on: boolean) => void;
}

/** One reusable row per device — dispatches by kind. Live lights (any config
 *  with a `deviceId`, e.g. `light1` or the Sonoff `sonoff1/2/3`) round-trip
 *  through `useHomeStore`; dummy lights use the shared local state passed
 *  down; sensors render straight from their config. */
export default function CardDevice({ config, state, onToggle }: CardDeviceProps) {
  const liveDevices = useHomeStore((s) => s.devices);
  const toggle = useHomeStore((s) => s.toggle);
  const icon = deviceIcon(config.kind);

  if (config.kind === "light") {
    const isLive = !!config.deviceId;
    const props: DeviceProps = {
      kind: "light",
      variant: "card",
      label: config.label,
      defaultOn: config.defaultOn,
      state: isLive
        ? liveDevices[config.deviceId!]?.state.on === true
        : state,
      onToggle: isLive ? () => toggle(config.deviceId!) : onToggle,
      icon,
      badge: isLive ? "live" : "demo",
    };
    return <Device {...props} />;
  }

  if (config.kind === "lock") {
    const props: DeviceProps = {
      kind: "lock",
      variant: "card",
      label: config.label,
      state: state ?? config.locked ?? true,
      onToggle: onToggle as ((locked: boolean) => void) | undefined,
      badge: "demo",
    };
    return <Device {...props} />;
  }

  if (config.kind === "gas-leak") {
    const props: DeviceProps = {
      kind: "gas-leak",
      variant: "card",
      label: config.label,
      current: config.detected ?? false,
    };
    return <Device {...props} />;
  }

  const props: DeviceProps = {
    kind: "room-temp",
    variant: "card",
    label: config.label,
    current: config.current ?? 22,
    history: config.history,
  };
  return <Device {...props} />;
}
