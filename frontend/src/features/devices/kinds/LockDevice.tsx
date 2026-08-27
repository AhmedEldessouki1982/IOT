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

export type LockDeviceProps = CardProps | FloorProps;

/** Smart door lock — shared by dashboard card and floorplan glyph. */
export default function LockDevice(props: LockDeviceProps) {
  if (props.variant === "floorplan") {
    const locked = props.state.locked !== false;
    return (
      <g>
        {locked && (
          <circle r={0.34} fill="var(--fp-lock-glow)" opacity={0.25} className="fp-glow" />
        )}
        <path
          d="M -0.06 -0.03 v -0.07 a 0.06 0.06 0 0 1 0.12 0 v 0.07"
          className="fp-shackle"
          data-locked={locked}
        />
        <rect x={-0.095} y={-0.03} width={0.19} height={0.16} rx={0.04} className="fp-lockbody" data-locked={locked} />
        <circle cy={0.045} r={0.025} className="fp-keyhole" />
        {!locked && (
          <text y={-0.28} textAnchor="middle" className="fp-micro fp-alarm-text">
            UNLOCKED
          </text>
        )}
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
