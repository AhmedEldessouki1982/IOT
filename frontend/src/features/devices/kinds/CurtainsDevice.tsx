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
  /** total curtain rod width in meters */
  width?: number;
};

export type CurtainsDeviceProps = CardProps | FloorProps;

/** Motorized curtains — shared by dashboard card and floorplan glyph. */
export default function CurtainsDevice(props: CurtainsDeviceProps) {
  if (props.variant === "floorplan") {
    const open = Number(props.state.open ?? 70) / 100;
    const L = props.width ?? 1.8;
    const panel = (L * (1 - open)) / 2;
    return (
      <g transform={`rotate(${deg(props.rot ?? 0)})`}>
        <line x1={-L / 2} y1={0} x2={L / 2} y2={0} className="fp-curtain-track" />
        <line x1={-L / 2} y1={0} x2={-L / 2 + panel} y2={0} className="fp-curtain" />
        <line x1={L / 2 - panel} y1={0} x2={L / 2} y2={0} className="fp-curtain" />
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
