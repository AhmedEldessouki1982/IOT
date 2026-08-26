import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TempSensorReadoutProps {
  label: string;
  value: number;
  unit?: string;
  trend?: number[];
  icon?: ReactNode;
}

const DEFAULT_TREND = [22.1, 22.4, 23.0, 23.8, 23.5, 24.2, 24.5, 24.3, 24.5];

const VIEW_W = 200;
const VIEW_H = 40;
const PAD = 2;

function buildSparklinePath(data: number[]): string {
  if (data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * VIEW_W,
    y: PAD + ((v - min) / span) * (VIEW_H - PAD * 2),
  }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function buildSparklineArea(data: number[]): string {
  const linePath = buildSparklinePath(data);
  if (!linePath) return "";
  return `${linePath} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z`;
}

export default function TempSensorReadout({
  label,
  value,
  unit = "°C",
  trend = DEFAULT_TREND,
  icon,
}: TempSensorReadoutProps) {
  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const avg = trend.reduce((a, b) => a + b, 0) / trend.length;
  const delta = value - avg;
  const trendDir = delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat";

  const lineD = buildSparklinePath(trend);
  const areaD = buildSparklineArea(trend);
  const gradId = "sparkGrad";

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
      </div>

      <div className="sensor-big-number">
        {value.toFixed(1)}
        <span className="sensor-unit">{unit}</span>
      </div>

      <div className="sensor-trend">
        {trendDir === "up" && <TrendingUp size={13} strokeWidth={2} className="sensor-trend-icon sensor-trend-icon--up" />}
        {trendDir === "down" && <TrendingDown size={13} strokeWidth={2} className="sensor-trend-icon sensor-trend-icon--down" />}
        {trendDir === "flat" && <Minus size={13} strokeWidth={2} className="sensor-trend-icon sensor-trend-icon--flat" />}
        <span className="sensor-trend-text">
          {trendDir === "flat" ? "Stable" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}° vs avg`}
        </span>
      </div>

      <div className="sensor-sparkline">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className="sparkline-svg"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaD && <path d={areaD} fill={`url(#${gradId})`} />}
          {lineD && (
            <path
              d={lineD}
              fill="none"
              stroke="var(--teal)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      <div className="sensor-footer">
        <span>Min {min.toFixed(1)}{unit}</span>
        <span>Max {max.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}
