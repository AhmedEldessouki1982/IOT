import { Home, Moon, Sun } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

interface DashboardHeaderProps {
  online: boolean;
}

export default function DashboardHeader({ online }: DashboardHeaderProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <header className="dashboard-header">
      <div className="header-brand">
        <span className="header-brand-icon">
          <Home size={16} strokeWidth={2} />
        </span>
        <h1>Smart Apartment</h1>
      </div>
      <div className="header-actions">
        <span className="header-badge">
          <span className="header-dot" data-online={online} />
          {online ? "Online" : "Offline"}
        </span>
        <button
          type="button"
          className="theme-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
        </button>
      </div>
    </header>
  );
}
