const SCALE = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

interface TempSensorReadoutProps {
  label: string;
  value: number;
  unit?: string;
  trend?: number[];
}

const DEFAULT_TREND = [22.1, 22.4, 23.0, 23.8, 23.5, 24.2, 24.5, 24.3, 24.5];

export default function TempSensorReadout({
  label,
  value,
  unit = "",
  trend = DEFAULT_TREND,
}: TempSensorReadoutProps) {
  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const avg = trend.reduce((a, b) => a + b, 0) / trend.length;
  const span = max - min || 1;

  const bars = trend.map((v) => {
    const idx = Math.round(((v - min) / span) * (SCALE.length - 1));
    return { char: SCALE[Math.min(SCALE.length - 1, idx)], value: v };
  });

  return (
    <div className="px-3 py-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[0.7rem] uppercase tracking-[0.18em] text-term-muted">
          ▸ {label}
        </span>
        <span className="glow-text text-(--accent) text-xl font-semibold tabular-nums">
          {value.toFixed(1)}
          {unit}
        </span>
      </div>

      <div className="mt-2 flex items-end gap-[0.15rem] text-[0.85rem] leading-none" aria-hidden="true">
        {bars.map((b, i) => (
          <span
            key={i}
            className={
              b.value >= avg ? "text-(--accent)" : "text-term-muted"
            }
          >
            {b.char}
          </span>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[0.6rem] tracking-[0.15em] text-term-muted">
        <span>MIN {min.toFixed(1)}{unit}</span>
        <span>AVG {avg.toFixed(1)}{unit}</span>
        <span>MAX {max.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}