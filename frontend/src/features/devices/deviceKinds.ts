import { createElement, type ReactNode } from "react";
import { Lightbulb, Thermometer, Flame } from "lucide-react";

/**
 * Canonical device kinds shared by the room-card dashboard AND the 2D
 * floorplan. One component per kind (in ./kinds) renders either a DOM card
 * (variant="card") or an SVG floorplan glyph (variant="floorplan"), so the two
 * presentation contexts never keep their own per-kind switch.
 *
 *   canonical      dashboard (roomsConfig)   floorplan (DevicePlacement)
 *   --------       -----------------------   -----------------------------
 *   light     <->  light                     ceilingLight
 *   lamp      ->   (n/a / modeled as light)  lamp
 *   ac        ->   (n/a / modeled as light)  ac
 *   tv        ->   (n/a)                     tv
 *   curtains  ->   (n/a)                     curtains
 *   lock      ->   (n/a)                     lock
 *   temp      <->  temp                      sensor (sensorOf=tempC)
 *   gas       <->  gas                       sensor (sensorOf=smoke)
 */
export type DeviceKind =
  | "light"
  | "lamp"
  | "ac"
  | "tv"
  | "curtains"
  | "lock"
  | "temp"
  | "gas";

export type DeviceVariant = "card" | "floorplan";

/* ------------------------------------------------------------------ */
/*  Dashboard device config (source of truth for room card data)       */
/* ------------------------------------------------------------------ */

export interface LightConfig {
  kind: "light";
  id: string;
  label: string;
  defaultOn?: boolean;
}

export interface TempConfig {
  kind: "temp";
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: number[];
}

export interface GasConfig {
  kind: "gas";
  id: string;
  label: string;
  detected?: boolean;
}

export type DeviceConfig = LightConfig | TempConfig | GasConfig;

const LIGHT_ICON = { icon: Lightbulb, size: 15, strokeWidth: 1.5 };

export function deviceIcon(kind: DeviceConfig["kind"]): ReactNode {
  switch (kind) {
    case "light":
      return createElement(LIGHT_ICON.icon, LIGHT_ICON);
    case "temp":
      return createElement(Thermometer, { size: 15, strokeWidth: 1.5 });
    case "gas":
      return createElement(Flame, { size: 15, strokeWidth: 1.5 });
  }
}

/* ---------------------------------------------------------- floorplan */

/** radians -> degrees for SVG `rotate()` transforms on floorplan glyphs. */
export const deg = (rad: number) => (rad * 180) / Math.PI;

/** map a floorplan placement to its canonical device kind. */
export function toCanonicalKind(placement: {
  kind: string;
  sensorOf?: string;
}): DeviceKind {
  switch (placement.kind) {
    case "ceilingLight":
      return "light";
    case "lamp":
      return "lamp";
    case "ac":
      return "ac";
    case "tv":
      return "tv";
    case "curtains":
      return "curtains";
    case "lock":
      return "lock";
    case "sensor":
      return placement.sensorOf === "smoke" ? "gas" : "temp";
    default:
      return "light";
  }
}
