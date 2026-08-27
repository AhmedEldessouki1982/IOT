import { kelvinToHex } from "../../../apartment2d/utils/kelvin";
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
};

export type LightDeviceProps = CardProps | FloorProps;

/** Overhead / ceiling light — shared by dashboard card and floorplan glyph. */
export default function LightDevice(props: LightDeviceProps) {
  if (props.variant === "floorplan") {
    const on = Boolean(props.state.on);
    const brightness = Number(props.state.brightness ?? 80);
    const color = kelvinToHex(Number(props.state.kelvin ?? 3400));
    return (
      <>
        {on && (
          <circle
            r={0.42 + (brightness / 100) * 0.9}
            fill={color}
            opacity={0.24 + brightness / 400}
            className="fp-glow"
          />
        )}
        <circle r={0.11} className="fp-dot" data-on={on} style={on ? { fill: color } : undefined} />
        {on && <circle r={0.2} fill="none" stroke={color} strokeWidth={0.03} opacity={0.7} />}
      </>
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
