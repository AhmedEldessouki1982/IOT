import { Moon, Sun } from "lucide-react";
import { useThemeStore, type ThemeMode } from "../store/useThemeStore";

/**
 * Light/dark selection, persisted by useThemeStore.
 */
export default function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const select = (mode: ThemeMode) => setTheme(mode);

  return (
    <div
      className="theme-toggle"
      role="group"
      aria-label="Color theme"
      data-theme={theme}
    >
      <button
        type="button"
        className="theme-toggle-opt"
        aria-pressed={theme === "light"}
        aria-label="Light theme"
        onClick={() => select("light")}
      >
        {theme === "light" ? <span className="theme-knob" /> : null}
        <Sun size={15} strokeWidth={1.8} className="theme-toggle-icon" />
      </button>
      <button
        type="button"
        className="theme-toggle-opt"
        aria-pressed={theme === "dark"}
        aria-label="Dark theme"
        onClick={() => select("dark")}
      >
        {theme === "dark" ? <span className="theme-knob" /> : null}
        <Moon size={15} strokeWidth={1.8} className="theme-toggle-icon" />
      </button>
    </div>
  );
}
