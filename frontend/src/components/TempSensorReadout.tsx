import type { ReactNode } from "react";

interface TempSensorReadoutProps {
  label: string;
  value: number;
  unit?: string;
  trend?: number[];
  icon?: ReactNode;
}

const DEFAULT_TREND = [22.1, 22.4, 23.0, 23.8, 23.5, 24.2, 24.5, 24.3, 24.5];

export default function TempSensorReadout({
  label,
  value,
  unit = "",
  trend = DEFAULT_TREND,
  icon,
}: TempSensorReadoutProps) {
  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const avg = trend.reduce((a, b) => a + b, 0) / trend.length;
  const span = max - min || 1;

  const bars = trend.map((v) => ({
    pct: Math.max(10, Math.round(((v - min) / span) * 90)),
    active: v >= avg,
  }));

  return (
    <div className="sensor-readout">
      <div className="sensor-row">
        <div className="device-info">
          {icon && (
            <span className="device-icon" data-on="true">
              {icon}
            </span>
          )}
          <span className="device-label">{label}</span>
        </div>
        <span className="sensor-value">
          {value.toFixed(1)}{unit}
        </span>
      </div>

      <div className="sparkline" aria-hidden="true">
        {bars.map((b, i) => (
          <div
            key={i}
            className="spark-bar"
            data-active={b.active}
            style={{ height: `${b.pct}%`, animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>

      <div className="sensor-footer">
        <span>Min {min.toFixed(1)}{unit}</span>
        <span>Avg {avg.toFixed(1)}{unit}</span>
        <span>Max {max.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}
