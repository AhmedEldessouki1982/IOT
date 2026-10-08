import type { DeviceState } from "../../api/devices";
import type { DeviceConfig, DeviceKind } from "./deviceKinds";

type StateKey = "on" | "locked" | "active" | "detected";

const STATE_KEY_BY_KIND: Partial<Record<DeviceKind, StateKey>> = {
  light: "on",
  appliance: "on",
  lock: "locked",
  smoke: "active",
  "gas-leak": "detected",
};

export function liveStateKey(kind: DeviceKind): StateKey {
  return STATE_KEY_BY_KIND[kind] ?? "on";
}

export function liveDeviceId(config: DeviceConfig): string | undefined {
  return "deviceId" in config ? config.deviceId : undefined;
}

export function isLiveConfig(config: DeviceConfig): boolean {
  return !!liveDeviceId(config);
}

export function liveBooleanValue(
  config: DeviceConfig,
  device?: DeviceState,
): boolean | undefined {
  if (!device) return undefined;
  const value = device.state[liveStateKey(config.kind)];
  return typeof value === "boolean" ? value : undefined;
}

export function commandForKind(
  kind: DeviceKind,
  value: boolean,
): Record<string, boolean> {
  return { [liveStateKey(kind)]: value };
}
