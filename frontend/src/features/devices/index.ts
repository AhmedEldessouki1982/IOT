import { createElement, type ComponentType } from "react";
import type { DeviceKind } from "./deviceKinds";
import LightDevice, { type LightDeviceProps } from "./kinds/LightDevice";
import GasLeakSensor, { type GasLeakSensorProps } from "./kinds/GasLeakSensor";
import RoomTempSensor, { type RoomTempSensorProps } from "./kinds/RoomTempSensor";

export { LightDevice, GasLeakSensor, RoomTempSensor };

export type { DeviceKind, DeviceConfig } from "./deviceKinds";
export { deviceIcon } from "./deviceKinds";

/** One component per device kind — the single rendering point for every kind. */
const KIND_COMPONENTS: Record<DeviceKind, ComponentType<any>> = {
  light: LightDevice,
  "gas-leak": GasLeakSensor,
  "room-temp": RoomTempSensor,
};

/** Discriminated union: pick a kind, then the props valid for that kind. */
export type DeviceProps =
  | ({ kind: "light" } & LightDeviceProps)
  | ({ kind: "gas-leak" } & GasLeakSensorProps)
  | ({ kind: "room-temp" } & RoomTempSensorProps);

export type { LightDeviceProps, GasLeakSensorProps, RoomTempSensorProps };

/** Presentational dispatcher — routes a canonical kind to its shared component. */
export function Device(props: DeviceProps) {
  return createElement(KIND_COMPONENTS[props.kind], props);
}
