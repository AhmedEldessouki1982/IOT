import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useThemeStore, type ThemeMode } from "../store/useThemeStore";

/**
 * Light/dark switch — a glass segmented control whose animated knob rides a
 * spring track between the sun and moon. State lives in useThemeStore.
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
        {theme === "light" ? (
          <motion.span layoutId="theme-knob" className="theme-knob" />
        ) : null}
        <Sun size={15} strokeWidth={1.8} className="theme-toggle-icon" />
      </button>
      <button
        type="button"
        className="theme-toggle-opt"
        aria-pressed={theme === "dark"}
        aria-label="Dark theme"
        onClick={() => select("dark")}
      >
        {theme === "dark" ? (
          <motion.span layoutId="theme-knob" className="theme-knob" />
        ) : null}
        <Moon size={15} strokeWidth={1.8} className="theme-toggle-icon" />
      </button>
    </div>
  );
}
