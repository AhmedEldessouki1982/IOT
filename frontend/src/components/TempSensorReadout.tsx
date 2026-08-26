import type { ReactNode } from "react";

interface TempSensorReadoutProps {
  label: string;
  value: number;
  unit?: string;
  trend?: number[];
  icon?: ReactNode;
}

const DEFAULT_TREND = [22.1, 22.4, 23.0, 23.8, 23.5, 24.2, 24.5, 24.3, 24.5];

function tempColor(t: number, min: number, max: number): string {
  const ratio = Math.max(0, Math.min(1, (t - min) / (max - min || 1)));
  if (ratio < 0.33) return "#38bdf8"; // sky-400 — cool
  if (ratio < 0.66) return "#facc15"; // yellow-400 — mild
  return "#f97316"; // orange-500 — warm
}

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

  const bars = trend.map((v, i) => ({
    pct: Math.max(14, Math.round(((v - min) / span) * 86) + 14),
    color: tempColor(v, min, max),
    latest: i === trend.length - 1,
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
            className={`spark-bar ${b.latest ? "spark-bar--latest" : ""}`}
            style={{
              height: `${b.pct}%`,
              background: b.color,
              boxShadow: b.latest ? `0 0 8px ${b.color}44` : undefined,
              animationDelay: `${i * 50}ms`,
            }}
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
