import { Home, LayoutGrid, Cpu, Sparkles, Zap, Shield, Settings } from "lucide-react";

export type NavTab = "overview" | "rooms" | "devices" | "scenes" | "energy" | "security";

interface NavRailProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

const ITEMS: Array<{ id: NavTab; icon: typeof Home; label: string }> = [
  { id: "overview", icon: Home, label: "Home" },
  { id: "rooms", icon: LayoutGrid, label: "Rooms" },
  { id: "devices", icon: Cpu, label: "Devices" },
  { id: "scenes", icon: Sparkles, label: "Scenes" },
  { id: "energy", icon: Zap, label: "Energy" },
  { id: "security", icon: Shield, label: "Security" },
];

export default function NavRail({ active, onChange }: NavRailProps) {
  return (
    <nav className="cc-rail" aria-label="Primary">
      {ITEMS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className="cc-rail-item"
          data-active={active === id}
          onClick={() => onChange(id)}
          aria-label={id}
          title={id.charAt(0).toUpperCase() + id.slice(1)}
        >
          <Icon size={18} strokeWidth={1.6} />
        </button>
      ))}
      <div className="cc-rail-sep" />
      <div className="cc-rail-bottom">
        <button type="button" className="cc-rail-item" aria-label="Settings" title="Settings" onClick={() => onChange("overview")}>
          <Settings size={18} strokeWidth={1.6} />
        </button>
      </div>
    </nav>
  );
}
