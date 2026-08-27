import { deg } from "../deviceKinds";
import DeviceToggle from "../../../shared/DeviceToggle";

type CardProps = {
  variant: "card";
  label: string;
  defaultOn?: boolean;
  state?: boolean;
  onToggle?: (on: boolean) => void;
  icon?: React.ReactNode;
  badge?: "live" | "demo";
};

type FloorProps = {
  variant: "floorplan";
  state: Record<string, unknown>;
  rot?: number;
};

export type ACDeviceProps = CardProps | FloorProps;

/** Even-wall split AC — shared by dashboard card and floorplan glyph. */
export default function ACDevice(props: ACDeviceProps) {
  if (props.variant === "floorplan") {
    const on = Boolean(props.state.on);
    return (
      <g transform={`rotate(${deg(props.rot ?? 0)})`}>
        {on && (
          <>
            <path d="M -0.16 0.2 q 0.16 0.12 0.32 0" className="fp-air" />
            <path d="M -0.16 0.32 q 0.16 0.12 0.32 0" className="fp-air fp-air2" />
            <text y={-0.22} textAnchor="middle" className="fp-micro">
              {Number(props.state.tempC ?? 23)}° {String(props.state.mode ?? "cool").toUpperCase()}
            </text>
          </>
        )}
        <rect
          x={-0.21}
          y={-0.075}
          width={0.42}
          height={0.15}
          rx={0.05}
          className="fp-ac"
          data-on={on}
        />
        <line x1={-0.13} y1={0.03} x2={0.13} y2={0.03} className="fp-acvent" data-on={on} />
      </g>
    );
  }

  return (
    <DeviceToggle
      label={props.label}
      defaultState={props.defaultOn}
      state={props.state}
      onToggle={props.onToggle}
      icon={props.icon}
      badge={props.badge}
    />
  );
}
