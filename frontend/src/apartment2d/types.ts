/** Mirror of the backend DeviceState contract (nestjs/src/device/device.service.ts).
 *  The backend remains the single source of truth — these are read-only shapes. */

export type DeviceType = "switch" | "sensor" | "lock";

export interface DeviceState {
  deviceId: string;
  type: DeviceType;
  state: Record<string, unknown>;
  timestamp: string;
}

export type Vec3 = [number, number, number];

export type TimeOfDay = "day" | "night";

export type DeviceKind =
  | "ceilingLight"
  | "lamp"
  | "ac"
  | "tv"
  | "curtains"
  | "sensor"
  | "lock";

/** A logical device bound to a room in a plan/scene config. */
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
