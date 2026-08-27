import { deg } from "../deviceKinds";
import GasLeakSensor from "../../../shared/GasLeakSensor";

type CardProps = {
  variant: "card";
  detected?: boolean;
  icon?: React.ReactNode;
};

type FloorProps = {
  variant: "floorplan";
  state: Record<string, unknown>;
  rot?: number;
};

export type GasSensorDeviceProps = CardProps | FloorProps;

/** Gas / smoke sensor — shared by dashboard card and floorplan glyph. */
export default function GasSensorDevice(props: GasSensorDeviceProps) {
  if (props.variant === "floorplan") {
    const alarm = props.state.smoke === "alarm";
    const readout = alarm ? "ALERT" : "CLEAR";
    return (
      <g transform={`rotate(${deg(props.rot ?? 0)})`}>
        <rect
          x={-0.085}
          y={-0.085}
          width={0.17}
          height={0.17}
          transform="rotate(45)"
          className="fp-sensor"
          data-alarm={alarm}
        />
        <text x={0.26} y={0.07} className={`fp-sensortext${alarm ? " fp-alarm-text" : ""}`}>
          {readout}
        </text>
      </g>
    );
  }

  return <GasLeakSensor detected={props.detected} icon={props.icon} />;
}
