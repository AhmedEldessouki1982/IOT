import type { DeviceKind, Vec3, DevicePlacement } from "../types";

/**
 * REAL APARTMENT CONFIGURATION — 2D FLOORPLAN
 *
 * Ground floor of the family apartment: reception/hall with an open-plan
 * American kitchen, main toilet off the corridor, three bedrooms along the
 * corridor (master last at the end) plus a private ensuite in the master,
 * and a smart lock on the main entrance door.
 *
 * Coordinates are meters, top-down, north up:
 *   x → east  (0 .. 12.2)
 *   z → south (0 .. 8.6)
 * The SVG renders this space directly (viewBox in meters).
 *
 * Device identity follows the same rule as the 3D twin: deviceIds are the
 * authoritative backend identities. `light1` is the only live device today;
 * everything else lights up the moment it publishes to `devices/<id>/state`.
 */

export const ENVELOPE = { w: 12.2, d: 8.6 };
export const GRID = 0.5;

/* ------------------------------------------------------------------ rooms */

export interface Room2D {
  id: string;
  name: string;
  /** [xMin, zMin, xMax, zMax] */
  bounds: [number, number, number, number];
  /** base accent color driving the room's pastel fill / furniture tint */
  color: string;
}

export const ROOMS_2D: Room2D[] = [
  { id: "reception", name: "Reception", bounds: [0, 0, 6.8, 4.2], color: "#f59e0b" },
  { id: "kitchen", name: "American Kitchen", bounds: [6.8, 0, 12.2, 4.2], color: "#10b981" },
  { id: "toilet", name: "Main Toilet", bounds: [0, 4.2, 2.0, 5.7], color: "#38bdf8" },
  { id: "corridor", name: "Corridor", bounds: [2.0, 4.2, 12.2, 5.7], color: "#94a3b8" },
  { id: "bed1", name: "Small Bedroom", bounds: [0, 5.7, 3.6, 8.6], color: "#ec4899" },
  { id: "bed2", name: "Bedroom 2", bounds: [3.6, 5.7, 7.2, 8.6], color: "#8b5cf6" },
  { id: "master", name: "Master Bedroom", bounds: [7.2, 5.7, 10.4, 8.6], color: "#6366f1" },
  { id: "ensuite", name: "Ensuite", bounds: [10.4, 5.7, 12.2, 8.6], color: "#22d3ee" },
];

/* ------------------------------------------------------------------ walls */

export interface WallRun {
  /** axis the wall RUNS along ("x" => horizontal at z=at, "z" => vertical at x=at) */
  axis: "x" | "z";
  at: number;
  from: number;
  to: number;
  gaps?: Array<[number, number]>;
}

export const WALLS: WallRun[] = [
  // perimeter
  { axis: "x", at: 0, from: 0, to: 12.2 }, // north
  { axis: "x", at: 8.6, from: 0, to: 12.2 }, // south
  { axis: "z", at: 0, from: 0, to: 8.6, gaps: [[2.9, 3.9]] }, // west + MAIN DOOR
  { axis: "z", at: 12.2, from: 0, to: 8.6 }, // east
  // interior
  { axis: "z", at: 6.8, from: 0, to: 4.2, gaps: [[1.0, 3.4]] }, // reception|kitchen — wide opening (american style)
  { axis: "x", at: 4.2, from: 0, to: 12.2, gaps: [[4.6, 5.8]] }, // hall/kitchen -> corridor archway
  { axis: "z", at: 2.0, from: 4.2, to: 5.7, gaps: [[4.55, 5.35]] }, // main toilet door
  { axis: "x", at: 5.7, from: 0, to: 12.2, gaps: [[2.45, 3.3], [5.05, 5.9], [9.4, 10.25]] }, // bedroom doors (master LAST down the corridor)
  { axis: "z", at: 3.6, from: 5.7, to: 8.6 }, // bed1 | bed2
  { axis: "z", at: 7.2, from: 5.7, to: 8.6 }, // bed2 | master
  { axis: "z", at: 10.4, from: 5.7, to: 8.6, gaps: [[7.0, 7.8]] }, // master | ensuite + ensuite door
];

/* ---------------------------------------------------------------- windows */

export interface WindowRun {
  axis: "x" | "z";
  at: number;
  from: number;
  to: number;
}

export const WINDOWS: WindowRun[] = [
  { axis: "x", at: 0, from: 1.4, to: 3.4 }, // reception north
  { axis: "z", at: 0, from: 0.9, to: 2.3 }, // reception west
  { axis: "x", at: 0, from: 8.0, to: 10.6 }, // kitchen north
  { axis: "z", at: 12.2, from: 1.2, to: 3.0 }, // kitchen east
  { axis: "z", at: 0, from: 6.4, to: 7.9 }, // bedroom 1 west
  { axis: "x", at: 8.6, from: 4.6, to: 6.2 }, // bedroom 2 south
  { axis: "x", at: 8.6, from: 7.9, to: 9.7 }, // master south
  { axis: "z", at: 12.2, from: 6.4, to: 7.6 }, // ensuite east
];

/* ------------------------------------------------------- door swing arcs */

export interface DoorSwing {
  axis: "x" | "z"; // axis of the HOST wall run
  at: number; // wall offset coordinate
  gap: [number, number]; // doorway span along the wall axis
  /** perpendicular direction the leaf swings toward (+1/-1) */
  into: 1 | -1;
  /** hinge sits at gap[0] (false) or gap[1] (true) */
  hingeAtEnd: boolean;
}

export const DOORS: DoorSwing[] = [
  { axis: "z", at: 0, gap: [2.9, 3.9], into: 1, hingeAtEnd: true }, // MAIN DOOR (smart lock)
  { axis: "z", at: 2.0, gap: [4.55, 5.35], into: -1, hingeAtEnd: true }, // toilet
  { axis: "x", at: 5.7, gap: [2.45, 3.3], into: 1, hingeAtEnd: false }, // bed1
  { axis: "x", at: 5.7, gap: [5.05, 5.9], into: 1, hingeAtEnd: false }, // bed2
  { axis: "x", at: 5.7, gap: [9.4, 10.25], into: 1, hingeAtEnd: false }, // master
  { axis: "z", at: 10.4, gap: [7.0, 7.8], into: 1, hingeAtEnd: false }, // ensuite
];

/* -------------------------------------------------------------- furniture */

export interface Footprint {
  kind: "rect" | "round";
  /** center position */
  x: number;
  z: number;
  /** rect extents (w along x, d along z) or circle diameter for round */
  w?: number;
  d?: number;
  rot?: number; // degrees clockwise
  label?: string;
}

const RECEPTION_FURNITURE: Footprint[] = [
  { kind: "rect", x: 5.1, z: 2.2, w: 2.4, d: 1.8, label: "rug" },
  { kind: "rect", x: 6.05, z: 2.2, w: 0.85, d: 2.0 }, // sofa seat (faces TV wall)
  { kind: "rect", x: 6.42, z: 2.2, w: 0.14, d: 2.0 }, // sofa back
  { kind: "round", x: 4.95, z: 2.2, w: 0.76 }, // coffee table
  { kind: "rect", x: 6.66, z: 2.2, w: 0.16, d: 1.7, label: "TV console" },
  { kind: "rect", x: 1.9, z: 1.5, w: 1.5, d: 0.9, label: "dining" },
  { kind: "round", x: 1.45, z: 0.95, w: 0.34 },
  { kind: "round", x: 2.35, z: 0.95, w: 0.34 },
  { kind: "round", x: 1.45, z: 2.05, w: 0.34 },
  { kind: "round", x: 2.35, z: 2.05, w: 0.34 },
];

const KITCHEN_FURNITURE: Footprint[] = [
  { kind: "rect", x: 9.5, z: 0.39, w: 5.2, d: 0.66, label: "counter" },
  { kind: "rect", x: 10.2, z: 0.39, w: 0.52, d: 0.46, label: "hob" },
  { kind: "round", x: 8.4, z: 0.39, w: 0.42, label: "sink" },
  { kind: "rect", x: 9.3, z: 2.35, w: 2.2, d: 0.75, label: "island" },
  { kind: "rect", x: 11.82, z: 1.15, w: 0.68, d: 0.75, label: "fridge" },
];

const TOILET_FURNITURE: Footprint[] = [
  { kind: "rect", x: 0.55, z: 4.62, w: 0.8, d: 0.8, label: "shower" },
  { kind: "round", x: 0.38, z: 5.32, w: 0.46, label: "wc" },
  { kind: "round", x: 1.62, z: 4.52, w: 0.4, label: "basin" },
];

const CORRIDOR_FURNITURE: Footprint[] = [
  { kind: "rect", x: 6.6, z: 4.95, w: 6.6, d: 0.68, label: "runner" },
  { kind: "rect", x: 11.85, z: 4.95, w: 0.35, d: 1.0, label: "console" },
];

const BED1_FURNITURE: Footprint[] = [
  { kind: "rect", x: 1.35, z: 7.15, w: 2.0, d: 1.5, label: "bed" },
  { kind: "rect", x: 0.55, z: 7.15, w: 0.32, d: 1.3, label: "pillows" },
  { kind: "round", x: 0.38, z: 6.15, w: 0.38 },
  { kind: "round", x: 0.38, z: 8.15, w: 0.38 },
  { kind: "rect", x: 2.95, z: 6.25, w: 0.75, d: 1.1, label: "wardrobe" },
];

const BED2_FURNITURE: Footprint[] = [
  { kind: "rect", x: 5.85, z: 7.15, w: 2.0, d: 1.5, label: "bed" },
  { kind: "rect", x: 6.65, z: 7.15, w: 0.32, d: 1.3, label: "pillows" },
  { kind: "round", x: 6.82, z: 6.15, w: 0.38 },
  { kind: "round", x: 6.82, z: 8.15, w: 0.38 },
  { kind: "rect", x: 3.95, z: 6.25, w: 0.7, d: 1.1, label: "wardrobe" },
];

const MASTER_FURNITURE: Footprint[] = [
  { kind: "rect", x: 8.8, z: 6.9, w: 1.7, d: 2.05, label: "bed" },
  { kind: "rect", x: 8.8, z: 6.08, w: 1.5, d: 0.34, label: "pillows" },
  { kind: "rect", x: 7.72, z: 6.0, w: 0.4, d: 0.4 },
  { kind: "rect", x: 9.88, z: 6.0, w: 0.4, d: 0.4 },
  { kind: "rect", x: 7.58, z: 7.95, w: 0.65, d: 1.3, label: "wardrobe" },
  { kind: "rect", x: 9.85, z: 8.28, w: 1.0, d: 0.45, label: "dresser" },
];

const ENSUITE_FURNITURE: Footprint[] = [
  { kind: "rect", x: 10.95, z: 6.28, w: 1.0, d: 1.05, label: "shower" },
  { kind: "round", x: 11.75, z: 6.4, w: 0.44, label: "basin" },
  { kind: "round", x: 11.78, z: 8.1, w: 0.46, label: "wc" },
];

export const FURNITURE: Record<string, Footprint[]> = {
  reception: RECEPTION_FURNITURE,
  kitchen: KITCHEN_FURNITURE,
  toilet: TOILET_FURNITURE,
  corridor: CORRIDOR_FURNITURE,
  bed1: BED1_FURNITURE,
  bed2: BED2_FURNITURE,
  master: MASTER_FURNITURE,
  ensuite: ENSUITE_FURNITURE,
};

/* ---------------------------------------------------------------- devices */

/** y values kept for future 3D reuse; the 2D renderer only reads x/z. */
function p(
  deviceId: string,
  kind: DeviceKind,
  name: string,
  roomId: string,
  position: Vec3,
  extra?: Partial<DevicePlacement>,
): DevicePlacement {
  return { deviceId, kind, name, roomId, position, ...extra };
}

export const DEVICES_2D: DevicePlacement[] = [
  // reception / hall
  p("light1", "ceilingLight", "Reception Ceiling Light", "reception", [3.4, 2.57, 2.1]),
  p("ac.rec", "ac", "Reception AC", "reception", [5.2, 2.15, 0.14], { rotationY: 0 }),
  p("tv.rec", "tv", "Television", "reception", [6.7, 1.05, 2.2], { rotationY: -Math.PI / 2 }),
  p("sensor.rec", "sensor", "Temp Sensor", "reception", [6.45, 1.5, 0.5], {
    rotationY: -Math.PI / 2,
    sensorOf: "tempC",
  }),
  // american kitchen
  p("kit.main-light", "ceilingLight", "Kitchen Light", "kitchen", [9.5, 2.57, 2.1]),
  p("kit.smoke-sensor", "sensor", "Smoke Detector", "kitchen", [9.5, 2.44, 1.1], {
    sensorOf: "smoke",
  }),
  // main toilet
  p("bath.light", "ceilingLight", "Toilet Light", "toilet", [1.0, 2.57, 4.95]),
  // corridor
  p("cor.light", "ceilingLight", "Corridor Light", "corridor", [6.2, 2.57, 4.95]),
  // small bedroom
  p("bed1.main-light", "ceilingLight", "Small Bedroom Light", "bed1", [1.8, 2.57, 7.15]),
  p("ac.bed1", "ac", "Small Bedroom AC", "bed1", [3.48, 2.15, 7.6], { rotationY: -Math.PI / 2 }),
  // bedroom 2
  p("bed2.main-light", "ceilingLight", "Bedroom 2 Light", "bed2", [5.4, 2.57, 7.15]),
  p("ac.bed2", "ac", "Bedroom 2 AC", "bed2", [3.72, 2.15, 7.6], { rotationY: Math.PI / 2 }),
  // master bedroom
  p("bed.main-light", "ceilingLight", "Master Bedroom Light", "master", [8.8, 2.57, 7.15]),
  p("bed.ac", "ac", "Master AC", "master", [10.28, 2.15, 6.1], { rotationY: -Math.PI / 2 }),
  p("bed.curtains", "curtains", "Master Curtains", "master", [8.8, 1.2, 8.52], {
    rotationY: 0,
    width: 1.9,
  }),
  p("bed.temp-sensor", "sensor", "Temp Sensor", "master", [7.35, 1.5, 8.35], {
    sensorOf: "tempC",
  }),
  // master ensuite
  p("bed.ens-light", "ceilingLight", "Ensuite Light", "ensuite", [11.3, 2.57, 7.15]),
  // entrance
  p("lock.main", "lock", "Smart Door Lock", "reception", [0.04, 1.05, 3.4]),
];
