import { Moon, Sun } from "lucide-react";
import Cursor from "./Cursor";
import { useThemeStore } from "../store/useThemeStore";

interface DashboardHeaderProps {
  online: boolean;
}

export default function DashboardHeader({ online }: DashboardHeaderProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <header className="border-b border-term-dim bg-term-bg/80 px-6 py-5">
      <div className="mx-auto flex max-w-6xl items-center gap-2 text-[0.85rem]">
        <span className="text-term-green">user@home-control</span>
        <span className="text-term-muted">:</span>
        <span className="text-term-amber">~</span>
        <span className="text-term-muted">$</span>
        <span className="text-term-fg">status --all</span>
        <Cursor className="text-term-green" />
        <div className="ml-auto flex items-center gap-5">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === "light"}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Moon size={12} /> : <Sun size={12} />}
            [{theme === "dark" ? "DARK" : "LIGHT"}]
          </button>
          <div className="hidden items-center gap-5 text-[0.7rem] tracking-widest text-term-muted sm:flex">
          <span>[4 ROOMS]</span>
          <span className="text-term-amber">[7 DEVICES]</span>
          <span className={`flex items-center gap-2 ${online ? "text-term-green" : "text-term-red"}`}>
            <span
              className={`h-1.5 w-1.5 rounded-none ${
                online
                  ? "animate-blink bg-term-green shadow-[0_0_6px_rgba(51,255,153,0.8)]"
                  : "bg-term-red"
              }`}
              aria-hidden="true"
            />
            [{online ? "ONLINE" : "OFFLINE"}]
          </span>
          </div>
        </div>
      </div>
    </header>
  );
}