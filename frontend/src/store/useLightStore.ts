import { create } from 'zustand';
import { io } from 'socket.io-client';
import { getState, toggle as apiToggle, type LightState } from '../api/light';

const socket = io('http://localhost:3000');

socket.on('light:state', (light: LightState) => useLightStore.setState({ light }));

interface LightStore {
  light: LightState | null;
  online: boolean;
  load: () => Promise<void>;
  toggle: () => Promise<void>;
}

export const useLightStore = create<LightStore>((set) => ({
  light: null,
  online: socket.connected,

  load: async () => {
    set({ light: await getState() });
  },

  toggle: async () => {
    const { state } = await apiToggle();
    set((s) =>
      s.light ? { light: { ...s.light, state } } : s,
    );
  },
}));

socket.on('connect', () => useLightStore.setState({ online: true }));
socket.on('disconnect', () => useLightStore.setState({ online: false }));