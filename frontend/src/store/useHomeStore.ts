import { create } from "zustand";
import { io } from "socket.io-client";
import { getDevice, sendCommand, type DeviceState } from "../api/devices";

/**
 * Live MQTT-backed device state, keyed by device id.
 *
 * Initially seeded from the `light1` mock device, then extended by every
 * `device:state` socket message the backend emits — including the Sonoff
 * T3US3C relays (`sonoff1/2/3`) and any future live device. Dummy lights and
 * locks live separately in useDummyToggles; only TRUE MQTT devices go here.
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const socket = io(API_URL);

interface HomeStore {
  /** Live device states: e.g. { light1: {...}, sonoff1: {...} } */
  devices: Record<string, DeviceState>;
  online: boolean;
  /** Fetch the current state of the given device from the backend. */
  load: (deviceId?: string) => Promise<void>;
  /** Optimistically flip a device's on/off and send the command via MQTT. */
  toggle: (deviceId: string) => Promise<void>;
}

export const useHomeStore = create<HomeStore>((set) => ({
  devices: {},
  online: socket.connected,

  load: async (deviceId = "light1") => {
    try {
      const d = await getDevice(deviceId);
      set((s) => ({ devices: { ...s.devices, [d.deviceId]: d } }));
    } catch {
      /* backend offline — leave state as-is */
    }
  },

  toggle: async (deviceId: string) => {
    // Optimistic UI: flip immediately so both the click and every connected
    // client feel snappy; the backend echoes the true state back on
    // `device:state` and we converge to the physical switch's reality.
    set((s) => {
      const cur = s.devices[deviceId];
      const nextOn = !(cur?.state.on ?? false);
      const base: DeviceState = cur ?? {
        deviceId,
        type: "switch",
        state: {},
        timestamp: new Date().toISOString(),
      };
      return {
        devices: {
          ...s.devices,
          [deviceId]: {
            ...base,
            state: { ...base.state, on: nextOn },
            timestamp: new Date().toISOString(),
          },
        },
      };
    });
    const on = useHomeStore.getState().devices[deviceId]?.state.on ?? false;
    sendCommand(deviceId, { on }).catch(() => {});
  },
}));

// --- live wiring -----------------------------------------------------------
// Backend broadcasts `device:state` for every live device (light1, sonoff1..3)
// over WebSocket. Capture them all into the devices map, regardless of id.
socket.on("device:state", (msg: DeviceState) => {
  if (!msg || typeof msg.deviceId !== "string") return;
  useHomeStore.setState((s) => ({ devices: { ...s.devices, [msg.deviceId]: msg } }));
});
socket.on("connect", () => useHomeStore.setState({ online: true }));
socket.on("disconnect", () => useHomeStore.setState({ online: false }));
socket.on("connect_error", () => {});
