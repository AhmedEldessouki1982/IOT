import { deg } from "../deviceKinds";
import TempSensorReadout from "../../../shared/TempSensorReadout";

type CardProps = {
  variant: "card";
  label: string;
  value: number;
  unit?: string;
  trend?: number[];
  icon?: React.ReactNode;
};

type FloorProps = {
  variant: "floorplan";
  state: Record<string, unknown>;
  rot?: number;
};

export type TempSensorDeviceProps = CardProps | FloorProps;

/** Temperature sensor — shared by dashboard card and floorplan glyph. */
export default function TempSensorDevice(props: TempSensorDeviceProps) {
  if (props.variant === "floorplan") {
    const v = Number(props.state.tempC ?? 24.5).toFixed(1);
    return (
      <g transform={`rotate(${deg(props.rot ?? 0)})`}>
        <rect
          x={-0.085}
          y={-0.085}
          width={0.17}
          height={0.17}
          transform="rotate(45)"
          className="fp-sensor"
          data-alarm={false}
        />
        <text x={0.26} y={0.07} className="fp-sensortext">
          {v}°
        </text>
      </g>
    );
  }

  return (
    <TempSensorReadout
      label={props.label}
      value={props.value}
      unit={props.unit}
      trend={props.trend}
      icon={props.icon}
    />
  );
}
