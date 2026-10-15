import { useHomeStore } from "../../store/useHomeStore";
import type { DeviceConfig } from "./deviceKinds";
import { deviceIcon } from "./deviceKinds";
import {
  isLiveConfig,
  liveBooleanValue,
  liveDeviceId,
  liveStateKey,
} from "./deviceRuntime";
import { Device, type DeviceProps } from "./index";
import DeviceConnection from "../../components/DeviceConnection";
import type { ReactNode } from "react";
import DeviceMotion from "../../components/DeviceMotion";

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
export default function CardDevice({
  config,
  state,
  onToggle,
}: CardDeviceProps) {
  const liveDevices = useHomeStore((s) => s.devices);
  const toggle = useHomeStore((s) => s.toggle);
  const setBoolean = useHomeStore((s) => s.setBoolean);
  const icon = deviceIcon(config.kind);
  const deviceId = liveDeviceId(config);
  const isLive = isLiveConfig(config);
  const row = (content: ReactNode) => <DeviceMotion deviceKey={deviceId ?? config.id} label={config.label} kind={config.kind}
    value={isLive ? liveValue : state ?? (config.kind === "lock" ? config.locked ?? true : config.kind === "light" ? config.defaultOn ?? false : false)}>
    <div className="device-shell">{content}{deviceId && <DeviceConnection deviceId={deviceId} />}</div>
  </DeviceMotion>;
  const liveValue = deviceId
    ? liveBooleanValue(config, liveDevices[deviceId])
    : undefined;
  const setLiveValue =
    isLive && deviceId
      ? (value: boolean) =>
          setBoolean(deviceId, liveStateKey(config.kind), value)
      : undefined;

  if (config.kind === "light") {
    const props: DeviceProps = {
      kind: "light",
      variant: "card",
      label: config.label,
      defaultOn: config.defaultOn,
      state: isLive ? liveValue === true : state,
      onToggle: isLive ? () => toggle(config.deviceId!) : onToggle,
      icon,
    };
    return row(<Device {...props} />);
  }

  if (config.kind === "lock") {
    const props: DeviceProps = {
      kind: "lock",
      variant: "card",
      label: config.label,
      state: isLive ? liveValue === true : (state ?? config.locked ?? true),
      onToggle: isLive ? setLiveValue : onToggle,
    };
    return row(<Device {...props} />);
  }

  if (config.kind === "appliance") {
    const props: DeviceProps = {
      kind: "appliance",
      icon,
      variant: "card",
      label: config.label,
      state: isLive ? liveValue === true : state,
      onToggle: isLive ? setLiveValue : onToggle,
    };
    return row(<Device {...props} />);
  }

  if (config.kind === "smoke") {
    const props: DeviceProps = {
      kind: "smoke",
      variant: "card",
      label: config.label,
      state: isLive ? liveValue === true : (state ?? config.active ?? false),
      onToggle: isLive ? setLiveValue : onToggle,
    };
    return row(<Device {...props} />);
  }

  if (config.kind === "gas-leak") {
    const props: DeviceProps = {
      kind: "gas-leak",
      variant: "card",
      label: config.label,
      current: config.detected ?? false,
    };
    return row(<Device {...props} />);
  }

  const props: DeviceProps = {
    kind: "room-temp",
    variant: "card",
    label: config.label,
    current: config.current ?? 22,
    history: config.history,
  };
  return row(<Device {...props} />);
}
