import type { DeviceKind, Vec3 } from "../types";

/**
 * APARTMENT CONFIGURATION LAYER
 *
 * Single source describing the digital twin: architecture (rooms, walls,
 * windows), procedural furniture, and — most importantly — the MAPPING between
 * real IoT devices (existing backend deviceIds) and their 3D representation.
 *
 * The 3D scene is generated from this file. Reconfiguring another apartment
 * means editing data here, not touching engine components.
 *
 * NOTE: only `light1` exists on the backend today (wildcard-discovered MQTT
 * switch). Other placements become live the moment a device publishes to
 * `devices/<id>/state` — zero code changes needed anywhere.
 */

export const WALL_HEIGHT = 2.6;
export const WALL_THICKNESS = 0.12;

/* ------------------------------------------------------------------ rooms */

export interface RoomDef {
  id: string;
  name: string;
  /** [xMin, zMin, xMax, zMax] floor rectangle */
  bounds: [number, number, number, number];
  floorColor: string;
  /** camera pose used by room navigation */
  view: { position: Vec3; target: Vec3 };
}

export const ROOMS: RoomDef[] = [
  {
    id: "kitchen",
    name: "Kitchen",
    bounds: [-5, -3.5, -0.5, 0],
    floorColor: "#cbc4b4",
    view: { position: [-8.5, 6.5, -8.5], target: [-2.7, 0.4, -1.6] },
  },
  {
    id: "living",
    name: "Living Room",
    bounds: [-0.5, -3.5, 5, 0],
    floorColor: "#c8a06a",
    view: { position: [9.5, 6.5, -8.5], target: [2.2, 0.5, -1.7] },
  },
  {
    id: "bathroom",
    name: "Bathroom",
    bounds: [-5, 0, -2.8, 3.5],
    floorColor: "#b9c0bf",
    view: { position: [-9.5, 6, 8.5], target: [-3.9, 0.4, 1.8] },
  },
  {
    id: "corridor",
    name: "Corridor",
    bounds: [-2.8, 0, 1, 3.5],
    floorColor: "#b59a70",
    view: { position: [-1, 6, 9], target: [-0.9, 0.4, 1.8] },
  },
  {
    id: "bedroom",
    name: "Bedroom",
    bounds: [1, 0, 5, 3.5],
    floorColor: "#bd9460",
    view: { position: [9.5, 6, 8.5], target: [3, 0.4, 1.8] },
  },
];

export const OVERVIEW_VIEW = {
  position: [11.5, 9.5, 12.5] as Vec3,
  target: [0, 0.2, 0] as Vec3,
};

/* ------------------------------------------------------------------ walls */

/** A straight wall run along one axis; `gaps` carve out doorways. */
export interface WallRun {
  /** axis the wall RUNS along ("x" => fixed z=at, "z" => fixed x=at) */
  axis: "x" | "z";
  at: number;
  from: number;
  to: number;
  gaps?: Array<[number, number]>;
}

export const WALLS: WallRun[] = [
  // perimeter
  { axis: "x", at: -3.5, from: -5, to: 5 }, // north
  { axis: "x", at: 3.5, from: -5, to: 5, gaps: [[-1.9, -1.0]] }, // south + entry
  { axis: "z", at: -5, from: -3.5, to: 3.5 }, // west
  { axis: "z", at: 5, from: -3.5, to: 3.5 }, // east
  // interior
  { axis: "z", at: -0.5, from: -3.5, to: 0, gaps: [[-2.7, -0.9]] }, // kitchen|living archway
  { axis: "x", at: 0, from: -5, to: -2.8, gaps: [[-4.5, -3.6]] }, // kitchen|bathroom door
  { axis: "x", at: 0, from: -2.8, to: -0.5, gaps: [[-2.3, -1.4]] }, // kitchen|corridor door
  // z=0 span x[-0.5,1] intentionally OPEN — living flows into corridor
  { axis: "x", at: 0, from: 1, to: 5, gaps: [[1.8, 2.7]] }, // living|bedroom door
  { axis: "z", at: -2.8, from: 0, to: 3.5, gaps: [[1.2, 2.1]] }, // bathroom|corridor door
  { axis: "z", at: 1, from: 0, to: 3.5 }, // corridor|bedroom
];

/* ---------------------------------------------------------------- windows */

export interface WindowInset {
  /** axis the host wall runs along */
  axis: "x" | "z";
  at: number;
  from: number;
  to: number;
  sill: number;
  top: number;
}

export const WINDOWS: WindowInset[] = [
  { axis: "x", at: -3.5, from: 1.25, to: 3.25, sill: 0.85, top: 2.25 }, // living
  { axis: "x", at: -3.5, from: -4.2, to: -2.8, sill: 0.95, top: 2.25 }, // kitchen
  { axis: "z", at: 5, from: 1.0, to: 2.2, sill: 0.85, top: 2.25 }, // bedroom
];

/* -------------------------------------------------------------- furniture */

export type FurnitureShape = "box" | "roundedBox" | "cylinder";

export interface FurniturePiece {
  shape: FurnitureShape;
  /** full extents for box shapes */
  size?: Vec3;
  /** cylinder */
  radius?: number;
  height?: number;
  /** center position */
  position: Vec3;
  rotationY?: number;
  color: string;
  roughness?: number;
  metalness?: number;
}

const WOOD_DARK = "#6f5136";
const UPHOLSTERY = "#4a5d68";

const LIVING_FURNITURE: FurniturePiece[] = [
  { shape: "box", size: [2.6, 0.02, 1.9], position: [2.9, 0.011, -1.75], color: "#9c8873", roughness: 1 },
  { shape: "box", size: [0.95, 0.42, 2.2], position: [4.35, 0.21, -1.75], color: UPHOLSTERY, roughness: 0.9 },
  { shape: "box", size: [0.22, 0.62, 2.2], position: [4.72, 0.53, -1.75], color: UPHOLSTERY, roughness: 0.9 },
  { shape: "box", size: [0.95, 0.34, 0.22], position: [4.38, 0.47, -2.74], color: UPHOLSTERY, roughness: 0.9 },
  { shape: "box", size: [0.95, 0.34, 0.22], position: [4.38, 0.47, -0.76], color: UPHOLSTERY, roughness: 0.9 },
  { shape: "box", size: [0.8, 0.14, 0.85], position: [4.3, 0.49, -2.15], color: "#6b8090", roughness: 1 },
  { shape: "box", size: [0.8, 0.14, 0.85], position: [4.3, 0.49, -1.35], color: "#6b8090", roughness: 1 },
  { shape: "roundedBox", size: [1.05, 0.34, 0.6], position: [2.85, 0.17, -1.75], color: WOOD_DARK, roughness: 0.6 },
  { shape: "box", size: [0.42, 0.5, 1.8], position: [-0.28, 0.25, -1.75], color: "#3a3f45", roughness: 0.5 },
  { shape: "cylinder", radius: 0.16, height: 0.34, position: [-0.12, 0.17, -3.12], color: "#a0623f", roughness: 0.9 },
];

const KITCHEN_FURNITURE: FurniturePiece[] = [
  { shape: "box", size: [4.1, 0.9, 0.62], position: [-2.7, 0.45, -3.16], color: "#37474f", roughness: 0.7 },
  { shape: "box", size: [4.2, 0.05, 0.68], position: [-2.7, 0.925, -3.16], color: "#d9d4c8", roughness: 0.35 },
  { shape: "box", size: [3.2, 0.7, 0.34], position: [-3.0, 1.95, -3.3], color: "#37474f", roughness: 0.7 },
  { shape: "box", size: [0.75, 1.8, 0.72], position: [-4.55, 0.9, -3.05], color: "#b8bec4", roughness: 0.35, metalness: 0.6 },
  { shape: "box", size: [1.5, 0.86, 0.75], position: [-2.6, 0.43, -1.35], color: "#37474f", roughness: 0.7 },
  { shape: "box", size: [1.6, 0.05, 0.85], position: [-2.6, 0.89, -1.35], color: "#d9d4c8", roughness: 0.35 },
  { shape: "cylinder", radius: 0.17, height: 0.62, position: [-2.9, 0.31, -0.82], color: "#8a6844", roughness: 0.7 },
  { shape: "cylinder", radius: 0.17, height: 0.62, position: [-2.3, 0.31, -0.82], color: "#8a6844", roughness: 0.7 },
];

const BEDROOM_FURNITURE: FurniturePiece[] = [
  { shape: "box", size: [1.9, 0.02, 1.4], position: [3.2, 0.011, 1.75], color: "#a9997f", roughness: 1 },
  { shape: "box", size: [1.75, 0.35, 2.15], position: [4.05, 0.175, 1.75], color: "#5d4a38", roughness: 0.8 },
  { shape: "box", size: [1.65, 0.24, 2.05], position: [4.05, 0.47, 1.75], color: "#e8e2d6", roughness: 0.95 },
  { shape: "box", size: [1.67, 0.1, 1.25], position: [3.72, 0.62, 1.42], color: "#93a58c", roughness: 1 },
  { shape: "box", size: [0.6, 0.14, 0.35], position: [4.55, 0.64, 1.42], color: "#f4efe4", roughness: 1 },
  { shape: "box", size: [0.6, 0.14, 0.35], position: [4.55, 0.64, 2.08], color: "#f4efe4", roughness: 1 },
  { shape: "box", size: [0.12, 0.95, 1.85], position: [4.9, 0.48, 1.75], color: WOOD_DARK, roughness: 0.6 },
  { shape: "box", size: [0.42, 0.5, 0.42], position: [4.66, 0.25, 0.33], color: WOOD_DARK, roughness: 0.6 },
  { shape: "box", size: [0.42, 0.5, 0.42], position: [4.66, 0.25, 3.17], color: WOOD_DARK, roughness: 0.6 },
  { shape: "box", size: [1.4, 2.2, 0.6], position: [2.2, 1.1, 3.16], color: "#4e3b2a", roughness: 0.65 },
];

const BATHROOM_FURNITURE: FurniturePiece[] = [
  { shape: "box", size: [0.6, 0.85, 1.1], position: [-3.05, 0.425, 2.85], color: "#5c6f66", roughness: 0.6 },
  { shape: "cylinder", radius: 0.19, height: 0.12, position: [-3.05, 0.91, 2.85], color: "#eeeeea", roughness: 0.3 },
  { shape: "box", size: [0.04, 0.85, 0.75], position: [-2.84, 1.65, 2.85], color: "#cfd8dc", roughness: 0.15, metalness: 0.8 },
  { shape: "roundedBox", size: [1.55, 0.55, 0.78], position: [-4.15, 0.275, 0.55], color: "#f2f2ee", roughness: 0.3 },
  { shape: "box", size: [0.7, 0.015, 0.45], position: [-4.15, 0.008, 1.2], color: "#cbd5cf", roughness: 1 },
];

const CORRIDOR_FURNITURE: FurniturePiece[] = [
  { shape: "box", size: [0.32, 0.8, 1.0], position: [-2.62, 0.4, 1.2], color: WOOD_DARK, roughness: 0.6 },
  { shape: "box", size: [1.5, 0.02, 2.6], position: [-0.9, 0.011, 2.0], color: "#9c8873", roughness: 1 },
];

export const FURNITURE: Record<string, FurniturePiece[]> = {
  living: LIVING_FURNITURE,
  kitchen: KITCHEN_FURNITURE,
  bedroom: BEDROOM_FURNITURE,
  bathroom: BATHROOM_FURNITURE,
  corridor: CORRIDOR_FURNITURE,
};

/* ---------------------------------------------------------------- devices */

export interface DevicePlacement {
  /** EXISTING backend deviceId — the authoritative identity */
  deviceId: string;
  kind: DeviceKind;
  name: string;
  roomId: string;
  position: Vec3;
  rotationY?: number;
  /** curtains: total rod width in meters */
  width?: number;
  /** sensor metric to display */
  sensorOf?: "tempC" | "humidity" | "smoke";
}

export const DEVICES: DevicePlacement[] = [
  // living room
  { deviceId: "light1", kind: "ceilingLight", name: "Living Ceiling Light", roomId: "living", position: [2.25, 2.57, -1.75] },
  { deviceId: "lamp.living", kind: "lamp", name: "Floor Lamp", roomId: "living", position: [4.55, 0, -2.95] },
  { deviceId: "ac.living", kind: "ac", name: "Living AC", roomId: "living", position: [2.25, 2.15, -3.43], rotationY: 0 },
  { deviceId: "tv.living", kind: "tv", name: "Television", roomId: "living", position: [-0.36, 1.05, -1.75], rotationY: Math.PI / 2 },
  { deviceId: "curtains.living", kind: "curtains", name: "Living Curtains", roomId: "living", position: [2.25, 1.2, -3.42], rotationY: 0, width: 2.2 },
  { deviceId: "sensor.living", kind: "sensor", name: "Temp Sensor", roomId: "living", position: [4.93, 1.5, -0.55], rotationY: -Math.PI / 2, sensorOf: "tempC" },
  // kitchen
  { deviceId: "kit.main-light", kind: "ceilingLight", name: "Kitchen Light", roomId: "kitchen", position: [-2.75, 2.57, -1.75] },
  { deviceId: "kit.smoke-sensor", kind: "sensor", name: "Smoke Detector", roomId: "kitchen", position: [-2.75, 2.44, -0.9], sensorOf: "smoke" },
  // bedroom
  { deviceId: "bed.main-light", kind: "ceilingLight", name: "Bedroom Light", roomId: "bedroom", position: [3, 2.57, 1.75] },
  { deviceId: "bed.ac", kind: "ac", name: "Bedroom AC", roomId: "bedroom", position: [1.07, 2.15, 2.6], rotationY: Math.PI / 2 },
  { deviceId: "bed.curtains", kind: "curtains", name: "Bedroom Curtains", roomId: "bedroom", position: [4.92, 1.18, 1.6], rotationY: -Math.PI / 2, width: 1.5 },
  { deviceId: "bed.temp-sensor", kind: "sensor", name: "Temp Sensor", roomId: "bedroom", position: [2.2, 1.5, 3.43], rotationY: Math.PI, sensorOf: "tempC" },
  // bathroom
  { deviceId: "bath.light", kind: "ceilingLight", name: "Bathroom Light", roomId: "bathroom", position: [-3.9, 2.57, 1.75] },
  // corridor
  { deviceId: "cor.light", kind: "ceilingLight", name: "Corridor Light", roomId: "corridor", position: [-0.9, 2.57, 2.2] },
];

/* --------------------------------------------------------- state defaults */

/** Sensible visualization defaults before real backend state arrives. */
export function defaultStateFor(kind: DeviceKind): Record<string, unknown> {
  switch (kind) {
    case "ceilingLight":
    case "lamp":
      return { on: false, brightness: 80, kelvin: 3400 };
    case "ac":
      return { on: false, tempC: 23, mode: "cool", fan: "auto" };
    case "tv":
      return { on: false };
    case "curtains":
      return { open: 70 };
    case "sensor":
      return {};
  }
}
