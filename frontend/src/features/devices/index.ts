import { createElement, type ComponentType } from "react";
import type { DeviceKind } from "./deviceKinds";
import LightDevice, { type LightDeviceProps } from "./kinds/LightDevice";
import LampDevice, { type LampDeviceProps } from "./kinds/LampDevice";
import ACDevice, { type ACDeviceProps } from "./kinds/ACDevice";
import TVDevice, { type TVDeviceProps } from "./kinds/TVDevice";
import CurtainsDevice, { type CurtainsDeviceProps } from "./kinds/CurtainsDevice";
import LockDevice, { type LockDeviceProps } from "./kinds/LockDevice";
import TempSensorDevice, { type TempSensorDeviceProps } from "./kinds/TempSensorDevice";
import GasSensorDevice, { type GasSensorDeviceProps } from "./kinds/GasSensorDevice";

export { LightDevice, LampDevice, ACDevice, TVDevice, CurtainsDevice, LockDevice, TempSensorDevice, GasSensorDevice };

export type { DeviceKind, DeviceVariant } from "./deviceKinds";
export type { LightConfig, TempConfig, GasConfig, DeviceConfig } from "./deviceKinds";
export { deviceIcon, toCanonicalKind, deg } from "./deviceKinds";

/** One component per device kind, shared by the dashboard (card) and the 2D
 *  floorplan (glyph). Each kind component renders whichever `variant` is
 *  requested. */
export const KIND_COMPONENTS: Record<DeviceKind, ComponentType<any>> = {
  light: LightDevice,
  lamp: LampDevice,
  ac: ACDevice,
  tv: TVDevice,
  curtains: CurtainsDevice,
  lock: LockDevice,
  temp: TempSensorDevice,
  gas: GasSensorDevice,
};

/** Discriminated union: pick a kind, then the props valid for that kind. */
export type DeviceProps =
  | ({ kind: "light" } & LightDeviceProps)
  | ({ kind: "lamp" } & LampDeviceProps)
  | ({ kind: "ac" } & ACDeviceProps)
  | ({ kind: "tv" } & TVDeviceProps)
  | ({ kind: "curtains" } & CurtainsDeviceProps)
  | ({ kind: "lock" } & LockDeviceProps)
  | ({ kind: "temp" } & TempSensorDeviceProps)
  | ({ kind: "gas" } & GasSensorDeviceProps);

/** Presentational dispatcher — routes a canonical kind to its shared component. */
export function Device(props: DeviceProps) {
  const { kind, ...rest } = props;
  return createElement(KIND_COMPONENTS[kind], rest);
}
