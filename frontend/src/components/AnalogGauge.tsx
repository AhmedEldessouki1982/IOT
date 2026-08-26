import { useEffect, useRef, useState } from "react";

interface AnalogGaugeProps {
  value: number;
  min: number;
  max: number;
  unit?: string;
  size?: number;
}

const START_DEG = 150;
const SWEEP_DEG = 240;
const CX = 80;
const CY = 82;
const R = 62;
const ARC_WIDTH = 10;
const TICK_R = R + 8;

function ratioToXY(ratio: number, r: number): [number, number] {
  const rad = ((START_DEG + ratio * SWEEP_DEG) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function arcColor(ratio: number): string {
  if (ratio < 0.33) return "#38bdf8";
  if (ratio < 0.66) return "#facc15";
  return "#f97316";
}

function arcPath(r: number, startRatio: number, endRatio: number): string {
  const [x1, y1] = ratioToXY(startRatio, r);
  const [x2, y2] = ratioToXY(endRatio, r);
  const sweep = (endRatio - startRatio) * SWEEP_DEG;
  const large = sweep > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

const SEGMENTS = 18;

export default function AnalogGauge({
  value,
  min,
  max,
  unit = "°C",
  size = 160,
}: AnalogGaugeProps) {
  const needleRef = useRef<SVGGElement>(null);
  const [mounted, setMounted] = useState(false);

  const span = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / span));

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const needleAngle = START_DEG + ratio * SWEEP_DEG;

  const segments = Array.from({ length: SEGMENTS }, (_, i) => {
    const s = i / SEGMENTS;
    const e = (i + 1) / SEGMENTS;
    return {
      d: arcPath(R, s, e),
      color: arcColor((s + e) / 2),
      delay: i * 18,
    };
  });

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const r = i / (tickCount - 1);
    const [x1, y1] = ratioToXY(r, R + 3);
    const [x2, y2] = ratioToXY(r, TICK_R);
    return { x1, y1, x2, y2 };
  });

  return (
    <svg
      viewBox="0 0 160 120"
      width={size}
      height={(size * 120) / 160}
      className="analog-gauge"
      aria-label={`${value}${unit}`}
    >
      {/* background track */}
      <path
        d={arcPath(R, 0, 1)}
        fill="none"
        stroke="var(--border)"
        strokeWidth={ARC_WIDTH}
        strokeLinecap="round"
      />

      {/* colored arc segments */}
      {segments.map((seg, i) => (
        <path
          key={i}
          d={seg.d}
          fill="none"
          stroke={seg.color}
          strokeWidth={ARC_WIDTH}
          strokeLinecap="butt"
          className="gauge-seg"
          style={{
            animationDelay: `${seg.delay}ms`,
            opacity: mounted ? 1 : 0,
          }}
        />
      ))}

      {/* tick marks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="var(--text-muted)"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      ))}

      {/* min / max labels */}
      <text
        x={ratioToXY(0, TICK_R + 10)[0]}
        y={ratioToXY(0, TICK_R + 10)[1]}
        className="gauge-label"
      >
        {min.toFixed(0)}
      </text>
      <text
        x={ratioToXY(1, TICK_R + 10)[0]}
        y={ratioToXY(1, TICK_R + 10)[1]}
        className="gauge-label"
      >
        {max.toFixed(0)}
      </text>

      {/* needle */}
      <g
        ref={needleRef}
        className="gauge-needle"
        style={{
          transformOrigin: `${CX}px ${CY}px`,
          transform: `rotate(${needleAngle}deg)`,
          transition: mounted
            ? "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "none",
        }}
      >
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - R + 14}
          stroke={arcColor(ratio)}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r={4} fill={arcColor(ratio)} />
        <circle cx={CX} cy={CY} r={2} fill="var(--bg-card)" />
      </g>

      {/* center value */}
      <text x={CX} y={CY - 18} className="gauge-value">
        {value.toFixed(1)}
      </text>
      <text x={CX} y={CY - 6} className="gauge-unit">
        {unit}
      </text>
    </svg>
  );
}
