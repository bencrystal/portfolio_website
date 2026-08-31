"use client";

// Minimal multi-series SVG line chart: x is a date (ms timestamp), y is
// seconds or BPM. No dependencies; sized via viewBox so it scales on mobile.

export type Series = {
  name: string;
  color: string;
  points: { x: number; y: number }[]; // sorted by x
};

const W = 700;
const H = 260;
const PAD = { top: 12, right: 12, bottom: 28, left: 48 };

function niceTicks(min: number, max: number, count: number): number[] {
  if (min === max) return [min];
  const span = max - min;
  const rawStep = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? rawStep;
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) ticks.push(t);
  return ticks;
}

export default function Chart({ series, fmtY }: { series: Series[]; fmtY: (y: number) => string }) {
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">No data yet</p>;
  }

  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = 0;
  const yMax = Math.max(...ys) * 1.05 || 1;

  const px = (x: number) =>
    PAD.left + (xMax === xMin ? 0.5 : (x - xMin) / (xMax - xMin)) * (W - PAD.left - PAD.right);
  const py = (y: number) => H - PAD.bottom - ((y - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

  const yTicks = niceTicks(yMin, yMax, 4);
  // A handful of evenly spaced date labels.
  const dayMs = 86_400_000;
  const spanDays = Math.max(1, Math.round((xMax - xMin) / dayMs));
  const xLabelCount = Math.min(6, spanDays + 1);
  const xTicks = Array.from({ length: xLabelCount }, (_, i) => xMin + ((xMax - xMin) * i) / Math.max(1, xLabelCount - 1));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={py(t)} y2={py(t)} stroke="#262626" strokeWidth={1} />
          <text x={PAD.left - 6} y={py(t) + 4} textAnchor="end" fontSize={11} fill="#737373">
            {fmtY(t)}
          </text>
        </g>
      ))}
      {xTicks.map((t, i) => (
        <text key={i} x={px(t)} y={H - 8} textAnchor="middle" fontSize={11} fill="#737373">
          {new Date(t).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}
        </text>
      ))}
      {series.map((s) =>
        s.points.length === 1 ? (
          <circle key={s.name} cx={px(s.points[0].x)} cy={py(s.points[0].y)} r={3.5} fill={s.color} />
        ) : (
          <polyline
            key={s.name}
            points={s.points.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )
      )}
    </svg>
  );
}
