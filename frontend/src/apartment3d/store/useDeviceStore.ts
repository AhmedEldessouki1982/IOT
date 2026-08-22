import { create } from "zustand";
import { io } from "socket.io-client";
import { getAllDevices, sendCommand } from "../api/devices";
import type { DeviceState } from "../types";

/* Module-level singleton socket — same mechanism as useLightStore, but on the
 * generic `device:state` event. Only imported by the /3d page (lazy chunk),
 * so Home never opens this connection. */
const socket = io("http://localhost:3000");

interface DeviceStore {
  /** deviceId -> latest authoritative state (backend is source of truth). */
  states: Record<string, DeviceState>;
  online: boolean;
  load: () => Promise<void>;
  sendCommand: (
    deviceId: string,
    command: Record<string, unknown>,
  ) => Promise<void>;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  states: {},
  online: socket.connected,

  load: async () => {
    const devices = await getAllDevices();
    const states: Record<string, DeviceState> = {};
    for (const d of devices) states[d.deviceId] = d;
    set({ states });
  },

  sendCommand: async (deviceId, command) => {
    // optimistic merge; the device republishes authoritative state over MQTT,
    // which arrives here as a `device:state` event moments later.
    set((s) => {
      const prev = s.states[deviceId];
      if (!prev) return s;
      return {
        states: {
          ...s.states,
          [deviceId]: {
            ...prev,
            state: { ...prev.state, ...command },
            timestamp: new Date().toISOString(),
          },
        },
      };
    });
    await sendCommand(deviceId, command);
  },
}));

socket.on("device:state", (next: DeviceState) => {
  useDeviceStore.setState((s) => ({ states: { ...s.states, [next.deviceId]: next } }));
});
socket.on("connect", () => useDeviceStore.setState({ online: true }));
socket.on("disconnect", () => useDeviceStore.setState({ online: false }));
