import { useThemeStore } from "../../store/useThemeStore";

export function TopBar({ online }: { online: boolean }) {
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
      </div>
      <div className="apt-topbar-side">
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
