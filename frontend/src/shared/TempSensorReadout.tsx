import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import DeviceRow from "./DeviceRow";
import Sparkline from "./Sparkline";

interface TempSensorReadoutProps {
  label: string;
  value: number;
  unit?: string;
  trend?: number[];
  icon?: React.ReactNode;
}

export default function TempSensorReadout({ label, value, unit = "°C", trend = [], icon }: TempSensorReadoutProps) {
  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const avg = trend.reduce((a, b) => a + b, 0) / trend.length;
  const delta = value - avg;
  const dir = delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat";

  return (
    <div className="sensor-readout">
      <DeviceRow label={label} icon={icon} iconAttrs={{ "data-on": "true" }} />

      <div className="sensor-big-number">
        {value.toFixed(1)}
        <span className="sensor-unit">{unit}</span>
      </div>

      <div className="sensor-trend">
        {dir === "up" && <TrendingUp size={13} strokeWidth={2} className="sensor-trend-icon sensor-trend-icon--up" />}
        {dir === "down" && <TrendingDown size={13} strokeWidth={2} className="sensor-trend-icon sensor-trend-icon--down" />}
        {dir === "flat" && <Minus size={13} strokeWidth={2} className="sensor-trend-icon sensor-trend-icon--flat" />}
        <span className="sensor-trend-text">
          {dir === "flat" ? "Stable" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}° vs avg`}
        </span>
      </div>

      <div className="sensor-sparkline">
        <Sparkline data={trend} id={`spark-${label.replace(/\s/g, "")}`} />
      </div>

      <div className="sensor-footer">
        <span>Min {min.toFixed(1)}{unit}</span>
        <span>Max {max.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}
