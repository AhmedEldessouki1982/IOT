import { create } from "zustand";
import { io } from "socket.io-client";
import { getDevice, sendCommand, type DeviceState } from "../api/devices";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const socket = io(API_URL);

socket.on("device:state", (msg: DeviceState) => {
  if (msg.deviceId === "light1") {
    useHomeStore.setState({ device: msg });
  }
});
socket.on("connect", () => useHomeStore.setState({ online: true }));
socket.on("disconnect", () => useHomeStore.setState({ online: false }));
socket.on("connect_error", () => {});

interface HomeStore {
  device: DeviceState | null;
  online: boolean;
  load: () => Promise<void>;
  toggle: () => Promise<void>;
}

export const useHomeStore = create<HomeStore>((set) => ({
  device: null,
  online: socket.connected,

  load: async () => {
    try {
      const d = await getDevice("light1");
      set({ device: d });
    } catch {
      /* backend offline — leave device null */
    }
  },

  toggle: async () => {
    set((s) => {
      const next = !(s.device?.state.on ?? false);
      const base = s.device ?? {
        deviceId: "light1",
        type: "switch",
        state: {},
        timestamp: new Date().toISOString(),
      };
      return {
        device: {
          ...base,
          state: { ...base.state, on: next },
          timestamp: new Date().toISOString(),
        },
      };
    });
    const on = useHomeStore.getState().device?.state.on ?? false;
    sendCommand("light1", { on }).catch(() => {});
  },
}));
