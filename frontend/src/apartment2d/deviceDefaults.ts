import type { DeviceKind } from "./types";

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
    case "lock":
      return { locked: true };
    case "sensor":
      return {};
  }
}
