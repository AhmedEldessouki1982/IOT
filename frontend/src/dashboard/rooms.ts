import type { DeviceConfig } from "../features/devices";

export interface Room {
  id: string;
  name: string;
  devices: DeviceConfig[];
  /** Live Sonoff 3-gang switch relays shown as balanced switch cards. */
  switches?: DeviceConfig[];
  /**
   * Backend routine **room id** (see GET /api/rooms). When set, the room
   * renders the reusable RoutinePanel (role text, press hints, live state and
   * countdowns) fetched from `GET /api/rooms/<routineId>`, so it must match the
   * switch's registry `roomId`. For the main toilet both happen to be "toilet".
   */
  routineId?: string;
  /** Grid span class for the room's bento card (defaults to wide). */
  span?: string;
  /**
   * Rooms inside this one, rendered as nested cards (e.g. the Master Toilet
   * inside the Master Suite). A nested room is an ordinary Room config, so it
   * reuses every component unchanged.
   */
  nested?: Room[];
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
      {
        kind: "light",
        id: "light1",
        deviceId: "light1",
        label: "Reception Ceiling Light",
      },
      {
        kind: "lock",
        id: "lock-front-door",
        label: "Front Door",
        locked: true,
      },
      {
        kind: "room-temp",
        id: "reception-temp",
        label: "Room Temperature",
        current: 21.5,
        history: [21.8, 21.6, 21.4, 21.7, 21.5, 21.3, 21.5],
      },
    ],
    // Physical Sonoff T3US3C 3-gang switch (Tasmota) in the reception — each
    // POWER relay is a live MQTT device rendered as a balanced switch card.
    switches: [
      {
        kind: "light",
        id: "sonoff1",
        deviceId: "sonoff1",
        label: "Reception Line 1",
      },
      {
        kind: "light",
        id: "sonoff2",
        deviceId: "sonoff2",
        label: "Reception Line 2",
      },
      { kind: "light", id: "sonoff3", deviceId: "sonoff3", label: "Door Bulb" },
    ],
    // Full row so the 3 switch cards sit side-by-side above the device list.
    span: "room-card--full",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    devices: [
      { kind: "light", id: "light2", label: "Kitchen Light" },
      {
        kind: "gas-leak",
        id: "kitchen-gas",
        label: "Gas Leak Detector",
        detected: false,
      },
      {
        kind: "room-temp",
        id: "kitchen-temp",
        label: "Room Temperature",
        current: 23.2,
        history: [23.0, 23.4, 23.1, 23.6, 23.2, 23.3, 23.2],
      },
      {
        kind: "light",
        id: "light_kitchen_ceiling_main",
        label: "Kitchen Ceiling Main",
      },
      {
        kind: "light",
        id: "light_kitchen_undercab",
        label: "Kitchen Under-Cabinet Light",
      },
      {
        kind: "light",
        id: "light_kitchen_peninsula_pendant",
        label: "Peninsula Pendant Light",
      },
      {
        kind: "appliance",
        id: "appliance_kitchen_oven",
        label: "Kitchen Oven",
      },
      {
        kind: "appliance",
        id: "appliance_kitchen_dishwasher",
        label: "Kitchen Dishwasher",
      },
      {
        kind: "smoke",
        id: "sensor_kitchen_smoke_01",
        label: "Kitchen Smoke Sensor",
        active: false,
      },
    ],
  },
  {
    id: "toilet",
    name: "Main Toilet",
    // The three gangs live on the physical Sonoff T3US3C switch (Tasmota topic
    // "mainToilet") and are driven through the reusable backend "toilet"
    // routine. Each click advances one stage: gang1 LED profile 10 → 30 → off,
    // gang2 Spotlights 10 → 30 → off, gang3 Exhaust 10 → off (single stage).
    // Roles + stage lists come from the backend (RoutinePanel).
    routineId: "toilet",
    devices: [],
    switches: [
      {
        kind: "light",
        id: "toilet-main-g1",
        deviceId: "toilet-main-g1",
        label: "LED profile",
      },
      {
        kind: "light",
        id: "toilet-main-g2",
        deviceId: "toilet-main-g2",
        label: "Spotlights",
      },
      {
        kind: "light",
        id: "toilet-main-g3",
        deviceId: "toilet-main-g3",
        label: "Exhaust fan",
      },
    ],
    // Full row so the 3 routine cards sit side-by-side (like Reception).
    span: "room-card--full",
  },
  {
    id: "corridor",
    name: "Corridor",
    devices: [{ kind: "light", id: "light4", label: "Corridor Light" }],
  },
  {
    id: "master",
    name: "Master Suite",
    devices: [
      {
        kind: "room-temp",
        id: "master-temp",
        label: "Room Temperature",
        current: 20.9,
        history: [21.1, 21.0, 20.8, 20.9, 21.0, 20.7, 20.9],
      },
    ],
    // Master bedroom wall switch (Tasmota topic "masterRoom"), 3 gangs. Manual
    // only for now: registry roomType "none" means no routine and no auto-off,
    // so the wall buttons and these cards just toggle the relays. No routineId,
    // so RoutinePanel renders the plain live switch cards.
    switches: [
      {
        kind: "light",
        id: "masterRoom-g1",
        deviceId: "masterRoom-g1",
        label: "LED Profile",
      },
      {
        kind: "light",
        id: "masterRoom-g2",
        deviceId: "masterRoom-g2",
        label: "Spotlight",
      },
      {
        kind: "light",
        id: "masterRoom-g3",
        deviceId: "masterRoom-g3",
        label: "Room Utility",
      },
    ],
    // The master toilet is its own switch (Tasmota topic "MasterRoomToilet")
    // and its own routine room, nested here as a card. Same "toilet" preset as
    // the main toilet: gang1 LED profile 10 → 30 → off, gang2 Spotlights
    // 10 → 30 → off, gang3 Exhaust 10 → off. Roles + stages come from the
    // backend (RoutinePanel), so nothing is duplicated in the UI.
    nested: [
      {
        id: "toilet-master",
        name: "Master Toilet",
        routineId: "toilet-master",
        devices: [],
        switches: [
          {
            kind: "light",
            id: "toilet-master-g1",
            deviceId: "toilet-master-g1",
            label: "LED profile",
          },
          {
            kind: "light",
            id: "toilet-master-g2",
            deviceId: "toilet-master-g2",
            label: "Spotlights",
          },
          {
            kind: "light",
            id: "toilet-master-g3",
            deviceId: "toilet-master-g3",
            label: "Exhaust fan",
          },
        ],
      },
    ],
  },
  {
    id: "girlRoom",
    name: "Girl Room",
    devices: [],
    // Girl's bedroom wall switch (Tasmota topic "girlRoom"), 3 gangs. Same
    // manual shape as the master bedroom switch: registry roomType "none" means
    // no routine and no auto-off timer, so the wall buttons and these cards just
    // toggle the relays. No routineId, so RoutinePanel renders the plain live
    // switch cards — which the explicit `routine={Boolean(roomId)}` flag keeps
    // off the routine press endpoint even though the ids end in "-g<n>".
    switches: [
      {
        kind: "light",
        id: "girlRoom-g1",
        deviceId: "girlRoom-g1",
        label: "LED Profile",
      },
      {
        kind: "light",
        id: "girlRoom-g2",
        deviceId: "girlRoom-g2",
        label: "Spotlight",
      },
      {
        kind: "light",
        id: "girlRoom-g3",
        deviceId: "girlRoom-g3",
        label: "Room Utility",
      },
    ],
  },
];

/** Every room including nested ones (parents first, then their children). */
export const ALL_ROOMS: Room[] = ROOMS.flatMap((room) => [
  room,
  ...(room.nested ?? []),
]);

/** Live device ids (MQTT-backed) that must round-trip through useHomeStore. */
export const LIVE_DEVICE_IDS = [
  "light1",
  "sonoff1",
  "sonoff2",
  "sonoff3",
  "toilet-main-g1",
  "toilet-main-g2",
  "toilet-main-g3",
  "toilet-master-g1",
  "toilet-master-g2",
  "toilet-master-g3",
  "masterRoom-g1",
  "masterRoom-g2",
  "masterRoom-g3",
  "girlRoom-g1",
  "girlRoom-g2",
  "girlRoom-g3",
];

/** Sonoff 3-gang relay ids rendered as balanced switch cards. */
export const SONOFF_DEVICE_IDS = [
  "sonoff1",
  "sonoff2",
  "sonoff3",
  "toilet-main-g1",
  "toilet-main-g2",
  "toilet-main-g3",
  "toilet-master-g1",
  "toilet-master-g2",
  "toilet-master-g3",
  "masterRoom-g1",
  "masterRoom-g2",
  "masterRoom-g3",
  "girlRoom-g1",
  "girlRoom-g2",
  "girlRoom-g3",
];

/** True when a device id belongs to the physical Sonoff 3-gang switch. */
export function isSonoffDevice(deviceId?: string): boolean {
  return !!deviceId && SONOFF_DEVICE_IDS.includes(deviceId);
}
