import { useState } from "react";
import DeviceRow from "./DeviceRow";

interface DeviceToggleProps {
  label: string;
  defaultState?: boolean;
  state?: boolean;
  icon?: React.ReactNode;
  onToggle?: (on: boolean) => void;
}

export default function DeviceToggle({ label, defaultState = false, state, icon, onToggle }: DeviceToggleProps) {
  const [internal, setInternal] = useState(defaultState);
  const on = state ?? internal;

  const handleClick = () => {
    const next = !on;
    if (state === undefined) setInternal(next);
    onToggle?.(next);
  };

  return (
    <DeviceRow
      label={label}
      icon={icon}
      iconAttrs={{ "data-on": String(on) }}
      status={
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
      }
    />
  );
}
