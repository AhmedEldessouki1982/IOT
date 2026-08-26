import {
  Lightbulb,
  Thermometer,
  DoorClosed,
  UtensilsCrossed,
  Bath,
  BedDouble,
  Flame,
} from "lucide-react";
import { createElement, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Device definitions per room                                        */
/* ------------------------------------------------------------------ */

export interface LightDevice {
  kind: "light";
  id: string;
  label: string;
  defaultOn?: boolean;
}

export interface TempDevice {
  kind: "temp";
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: number[];
}

export interface GasDevice {
  kind: "gas";
  id: string;
  label: string;
  detected?: boolean;
}

export type DeviceConfig = LightDevice | TempDevice | GasDevice;

export interface RoomConfig {
  id: string;
  name: string;
  icon: ReactNode;
  devices: DeviceConfig[];
}

/* ------------------------------------------------------------------ */
/*  Room data                                                          */
/* ------------------------------------------------------------------ */

const LIGHT_ICON = { icon: Lightbulb, size: 15, strokeWidth: 1.5 };

function lightIcon() {
  return createElement(LIGHT_ICON.icon, LIGHT_ICON);
}

const DEFAULT_TREND = [22.1, 22.4, 23.0, 23.8, 23.5, 24.2, 24.5, 24.3, 24.5];

export const ROOMS: RoomConfig[] = [
  {
    id: "reception",
    name: "Reception",
    icon: createElement(DoorClosed, { size: 16, strokeWidth: 1.5 }),
    devices: [
      { kind: "light", id: "light1", label: "Main Light" },
      { kind: "temp", id: "sensor.rec.temp", label: "Temperature", value: 24.5, unit: "°C", trend: DEFAULT_TREND },
    ],
  },
  {
    id: "dining",
    name: "Dining Area",
    icon: createElement(UtensilsCrossed, { size: 16, strokeWidth: 1.5 }),
    devices: [
      { kind: "light", id: "kit.ceiling", label: "Ceiling Light" },
      { kind: "light", id: "kit.pendant", label: "Pendant Light", defaultOn: true },
      { kind: "light", id: "kit.lamp", label: "Lamp" },
      { kind: "gas", id: "kit.gas", label: "Gas Leak Sensor" },
    ],
  },
  {
    id: "bathroom",
    name: "Bathroom",
    icon: createElement(Bath, { size: 16, strokeWidth: 1.5 }),
    devices: [
      { kind: "light", id: "bath.light", label: "Light" },
    ],
  },
  {
    id: "master",
    name: "Master Bedroom",
    icon: createElement(BedDouble, { size: 16, strokeWidth: 1.5 }),
    devices: [
      { kind: "light", id: "bed.main-light", label: "Main Light" },
      { kind: "light", id: "bed.ac", label: "AC Unit", defaultOn: true },
    ],
  },
];

export function totalDevices(rooms: RoomConfig[]): number {
  return rooms.reduce((n, r) => n + r.devices.length, 0);
}

export function deviceIcon(kind: DeviceConfig["kind"]): ReactNode {
  switch (kind) {
    case "light": return lightIcon();
    case "temp": return createElement(Thermometer, { size: 15, strokeWidth: 1.5 });
    case "gas": return createElement(Flame, { size: 15, strokeWidth: 1.5 });
  }
}
