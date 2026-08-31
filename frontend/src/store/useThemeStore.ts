import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "smart-home-theme";

function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}

interface ThemeStore {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

/**
 * Global light/dark preference, persisted to localStorage via zustand's
 * `persist` middleware. `toggleTheme` also flips `data-theme`/`colorScheme`
 * on `<html>` so the CSS token switch happens instantly on the same render.
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (mode) => {
        applyTheme(mode);
        set({ theme: mode });
      },
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
);
