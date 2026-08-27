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

export type TVDeviceProps = CardProps | FloorProps;

/** Flat-panel TV — shared by dashboard card and floorplan glyph. */
export default function TVDevice(props: TVDeviceProps) {
  if (props.variant === "floorplan") {
    const on = Boolean(props.state.on);
    return (
      <g transform={`rotate(${deg(props.rot ?? 0)})`}>
        {on && <rect x={-0.19} y={-0.12} width={0.38} height={0.24} className="fp-glowbox" />}
        <rect
          x={-0.17}
          y={-0.1}
          width={0.34}
          height={0.2}
          rx={0.02}
          className="fp-tv"
          data-on={on}
        />
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
