import type { DeviceConfig } from "../features/devices";

export interface Room {
  id: string;
  name: string;
  devices: DeviceConfig[];
}

/**
 * Single-page dashboard content. Light configs map 1:1 to the existing room
 * list; `light1` is the live (MQTT) reception light, the rest are local dummies.
 * Sensor values are dummy readings — swap for backend data without restructuring.
 */
export const ROOMS: Room[] = [
  {
    id: "reception",
    name: "Reception",
    devices: [
      { kind: "light", id: "light1", deviceId: "light1", label: "Reception Ceiling Light" },
      { kind: "room-temp", id: "reception-temp", label: "Room Temperature", current: 21.5, history: [21.8, 21.6, 21.4, 21.7, 21.5, 21.3, 21.5] },
    ],
  },
  {
    id: "kitchen",
    name: "Kitchen",
    devices: [
      { kind: "light", id: "light2", label: "Kitchen Light" },
      { kind: "gas-leak", id: "kitchen-gas", label: "Gas Leak Detector", detected: false },
      { kind: "room-temp", id: "kitchen-temp", label: "Room Temperature", current: 23.2, history: [23.0, 23.4, 23.1, 23.6, 23.2, 23.3, 23.2] },
    ],
  },
  {
    id: "toilet",
    name: "Toilet",
    devices: [{ kind: "light", id: "light3", label: "Toilet Light" }],
  },
  {
    id: "corridor",
    name: "Corridor",
    devices: [{ kind: "light", id: "light4", label: "Corridor Light" }],
  },
  {
    id: "bed1",
    name: "Small Bedroom",
    devices: [{ kind: "light", id: "light5", label: "Small Bedroom Light" }],
  },
  {
    id: "bed2",
    name: "Bedroom 2",
    devices: [{ kind: "light", id: "light6", label: "Bedroom 2 Light" }],
  },
  {
    id: "master",
    name: "Master Bedroom",
    devices: [
      { kind: "light", id: "light7", label: "Master Bedroom Light" },
      { kind: "room-temp", id: "master-temp", label: "Room Temperature", current: 20.9, history: [21.1, 21.0, 20.8, 20.9, 21.0, 20.7, 20.9] },
    ],
  },
  {
    id: "ensuite",
    name: "Ensuite",
    devices: [{ kind: "light", id: "light8", label: "Ensuite Light" }],
  },
];

/** Live device ids (MQTT-backed) that must round-trip through useHomeStore. */
export const LIVE_DEVICE_IDS = ["light1"];
