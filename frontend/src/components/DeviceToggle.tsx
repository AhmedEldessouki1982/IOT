import { useState, type ReactNode } from "react";

interface DeviceToggleProps {
  label: string;
  defaultState?: boolean;
  /** Controlled mode: when provided, state comes from the store instead of internal useState. */
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
      <span className="flex items-center gap-3">
        <span className="icon-box" data-on={on}>
          {icon}
        </span>
        <span className="text-[0.82rem] tracking-wide text-term-fg">{label}</span>
      </span>
      <button
        type="button"
        onClick={handleClick}
        data-on={on}
        aria-pressed={on}
        className="device-switch"
      >
        [{on ? "ON" : "OFF"}]
      </button>
    </div>
  );
}