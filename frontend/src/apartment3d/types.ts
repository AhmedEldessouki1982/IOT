/** Mirror of the backend DeviceState contract (nestjs/src/device/device.service.ts).
 *  The backend remains the single source of truth — this is a read-only shape. */
export type DeviceType = "switch" | "sensor" | "lock";

export interface DeviceState {
  deviceId: string;
  type: DeviceType;
  state: Record<string, unknown>;
  timestamp: string;
}

export type Vec3 = [number, number, number];

/** How a logical device kind maps into the 3D scene. */
export type DeviceKind =
  | "ceilingLight"
  | "lamp"
  | "ac"
  | "tv"
  | "curtains"
  | "sensor";
