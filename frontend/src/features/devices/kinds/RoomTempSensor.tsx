import { Thermometer } from "lucide-react";

export interface RoomTempSensorProps {
  variant: "card";
  label: string;
  /** degrees Celsius — dummy value for now. */
  current?: number;
  /** optional recent samples °C for a small sparkline. */
  history?: number[];
}

const MIN = 10;
const MAX = 40;

function Sparkline({ values }: { values: number[] }) {
  const w = 56;
  const h = 20;
  const span = MAX - MIN || 1;
  const step = w / Math.max(1, values.length - 1);
  const pts = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((Math.min(MAX, Math.max(MIN, v)) - MIN) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} aria-hidden="true" className="roomtemp-spark">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--cc-accent)"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Compact room-temperature reading — number + unit, small sparkline when samples exist. */
export default function RoomTempSensor({ label, current, history }: RoomTempSensorProps) {
  const value = current ?? 22;
  return (
    <div className="device-row roomtemp">
      <div className="device-info">
        <span className="device-icon">
          <Thermometer size={15} strokeWidth={1.6} />
        </span>
        <span className="device-label">{label}</span>
      </div>
      <div className="roomtemp-value">
        {history && history.length > 1 && <Sparkline values={history} />}
        <span className="roomtemp-num">{value.toFixed(1)}</span>
        <span className="roomtemp-unit">°C</span>
      </div>
    </div>
  );
}
