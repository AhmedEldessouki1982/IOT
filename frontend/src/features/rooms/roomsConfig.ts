import {
  DoorClosed,
  UtensilsCrossed,
  Bath,
  BedDouble,
} from "lucide-react";
import { createElement, type ReactNode } from "react";
import type { DeviceConfig } from "../devices/deviceKinds";

/* ------------------------------------------------------------------ */
/*  Room data                                                          */
/* ------------------------------------------------------------------ */

export interface RoomConfig {
  id: string;
  name: string;
  icon: ReactNode;
  devices: DeviceConfig[];
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
