import { DEVICES } from "../config/apartment";
import { useThemeStore } from "../../store/useThemeStore";
import type { TimeOfDay } from "../three/scene/ApartmentScene";

interface TopBarProps {
  online: boolean;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (t: TimeOfDay) => void;
}

export function TopBar({ online, timeOfDay, onTimeOfDayChange }: TopBarProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <header className="apt-topbar">
      <div className="apt-topbar-side">
        <a className="apt-back" href="/">
          ← HOME
        </a>
        <span className="apt-sep" />
        <span className="apt-title">SMART APARTMENT · DIGITAL TWIN</span>
        <span className="apt-chip">{DEVICES.length} DEVICES</span>
      </div>
      <div className="apt-topbar-side">
        <div className="apt-tod" role="group" aria-label="time of day">
          <button
            type="button"
            data-active={timeOfDay === "day"}
            onClick={() => onTimeOfDayChange("day")}
          >
            ☀ DAY
          </button>
          <button
            type="button"
            data-active={timeOfDay === "night"}
            onClick={() => onTimeOfDayChange("night")}
          >
            ☾ NIGHT
          </button>
        </div>
        <span className={`apt-online${online ? " is-on" : ""}`}>
          <i />
          {online ? "ONLINE" : "OFFLINE"}
        </span>
        <button type="button" className="apt-btn" onClick={toggle}>
          {theme === "dark" ? "LIGHT MODE" : "DARK MODE"}
        </button>
      </div>
    </header>
  );
}
