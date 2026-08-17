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
    pct: Math.max(12, Math.round(((v - min) / span) * 88)),
    above: v >= avg,
  }));

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="icon-box text-(--accent) border-(--accent)">
            {icon}
          </span>
        )}
        <div className="flex flex-1 items-baseline justify-between gap-4">
          <span className="text-[0.7rem] uppercase tracking-[0.18em] text-term-muted">
            ▸ {label}
          </span>
          <span className="glow-text text-(--accent) text-xl font-semibold tabular-nums">
            {value.toFixed(1)}
            {unit}
          </span>
        </div>
      </div>

      <div className="mt-3 flex h-9 items-end gap-[3px]" aria-hidden="true">
        {bars.map((b, i) => (
          <div
            key={i}
            className={`spark-bar flex-1 ${
              b.above
                ? "bg-(--accent) shadow-[0_0_6px_var(--accent-glow)]"
                : "bg-term-dim"
            }`}
            style={{ height: `${b.pct}%`, animationDelay: `${i * 45}ms` }}
          />
        ))}
      </div>

      <div className="mt-2.5 flex justify-between text-[0.6rem] tracking-[0.15em] text-term-muted">
        <span>MIN {min.toFixed(1)}{unit}</span>
        <span>AVG {avg.toFixed(1)}{unit}</span>
        <span>MAX {max.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}