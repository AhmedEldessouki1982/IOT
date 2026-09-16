import { createElement, type ReactNode } from "react";
import { Lightbulb, Flame, Thermometer, Lock, Power, BellRing } from "lucide-react";

/**
 * Canonical device kinds, each mapped to exactly one reusable component in
 * KIND_COMPONENTS. `Device` is the presentational dispatcher — components
 * never dispatch by kind, they only render themselves.
 */
export type DeviceKind = "light" | "gas-leak" | "room-temp" | "lock" | "appliance" | "smoke";

/* ------------------------------------------------------------------ */
/*  Device configs — discriminated by `kind`, source of truth per kind */
/* ------------------------------------------------------------------ */

export interface LightConfig {
  kind: "light";
  id: string;
  /** MQTT device id this light rounds-trips with the backend (`light1`). */
  deviceId?: string;
  label: string;
  defaultOn?: boolean;
}

export interface GasLeakConfig {
  kind: "gas-leak";
  id: string;
  label: string;
  /** Dummy value for now; swap for a backend reading later. */
  detected?: boolean;
}

export interface RoomTempConfig {
  kind: "room-temp";
  id: string;
  label: string;
  /** degrees Celsius — dummy value for now. */
  current?: number;
  /** optional recent samples °C for the sparkline. */
  history?: number[];
}

export interface LockConfig {
  kind: "lock";
  id: string;
  /** MQTT device id this lock rounds-trips with the backend, once wired. */
  deviceId?: string;
  label: string;
  /** Dummy value for now — swap for a backend reading later. */
  locked?: boolean;
}

export interface ApplianceConfig {
  kind: "appliance";
  id: string;
  /** MQTT device id this appliance rounds-trips with, once wired. */
  deviceId?: string;
  label: string;
}

export interface SmokeConfig {
  kind: "smoke";
  id: string;
  /** MQTT device id this sensor rounds-trips with, once wired. */
  deviceId?: string;
  label: string;
  /** Dummy value — smoke alarm armed (safe) vs triggered (alarm). */
  active?: boolean;
}

export type DeviceConfig =
  | LightConfig
  | GasLeakConfig
  | RoomTempConfig
  | LockConfig
  | ApplianceConfig
  | SmokeConfig;

/* ------------------------------------------------------------------ */
/*  Default icons                                                       */
/* ------------------------------------------------------------------ */

const ICONS: Record<
  DeviceKind,
  { icon: typeof Lightbulb; size: number; strokeWidth: number }
> = {
  light: { icon: Lightbulb, size: 15, strokeWidth: 1.5 },
  "gas-leak": { icon: Flame, size: 15, strokeWidth: 1.6 },
  "room-temp": { icon: Thermometer, size: 15, strokeWidth: 1.6 },
  lock: { icon: Lock, size: 15, strokeWidth: 1.7 },
  appliance: { icon: Power, size: 15, strokeWidth: 1.6 },
  smoke: { icon: BellRing, size: 15, strokeWidth: 1.7 },
};

export function deviceIcon(kind: DeviceKind): ReactNode {
  const c = ICONS[kind];
  return createElement(c.icon, c);
}
