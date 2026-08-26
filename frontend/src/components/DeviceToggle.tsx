import { useState, type ReactNode } from "react";

interface DeviceToggleProps {
  label: string;
  defaultState?: boolean;
  state?: boolean;
  icon?: ReactNode;
  onToggle?: (on: boolean) => void;
}

export default function DeviceToggle({
  label,
  defaultState = false,
  state,
  icon,
  onToggle,
}: DeviceToggleProps) {
  const [internal, setInternal] = useState(defaultState);
  const on = state ?? internal;

  const handleClick = () => {
    const next = !on;
    if (state === undefined) setInternal(next);
    onToggle?.(next);
  };

  return (
    <div className="device-row">
      <div className="device-info">
        <span className="device-icon" data-on={on}>
          {icon}
        </span>
        <span className="device-label">{label}</span>
      </div>
      <button
        type="button"
        onClick={handleClick}
        data-on={on}
        aria-pressed={on}
        aria-label={`${label}: ${on ? "on" : "off"}`}
        className="toggle"
      >
        <span className="toggle-knob" />
      </button>
    </div>
  );
}
