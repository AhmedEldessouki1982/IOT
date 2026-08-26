const VIEW_W = 200;
const VIEW_H = 40;
const PAD = 2;

function buildLine(data: number[]): string {
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

    const t = 0.3;
    d += ` C ${p1.x + (p2.x - p0.x) * t} ${p1.y + (p2.y - p0.y) * t}, ${p2.x - (p3.x - p1.x) * t} ${p2.y - (p3.y - p1.y) * t}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function buildArea(data: number[]): string {
  const line = buildLine(data);
  if (!line) return "";
  return `${line} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z`;
}

interface SparklineProps {
  data: number[];
  className?: string;
  id?: string;
}

export default function Sparkline({ data, className = "sparkline-svg", id = "sparkGrad" }: SparklineProps) {
  const lineD = buildLine(data);
  const areaD = buildArea(data);

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaD && <path d={areaD} fill={`url(#${id})`} />}
      {lineD && (
        <path d={lineD} fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
