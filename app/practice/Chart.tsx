"use client";

// Minimal multi-series SVG chart, no dependencies, sized via viewBox.
// Line mode suits BPM — a capability that persists between sessions, so
// interpolating is honest. Bar mode (stacked day totals) suits time —
// sessions are discrete events, and a line would invent practice on the
// days in between.

export type Point = { x: number; y: number; label?: string };
export type Series = {
  name: string;
  color: string;
  dash?: boolean; // dashed line (e.g. up-stroke variant)
  target?: number; // horizontal goal line (BPM mode)
  points: Point[]; // sorted by x
};

const W = 700;
const H = 260;
const PAD = { top: 12, right: 12, bottom: 28, left: 48 };
const DAY = 86_400_000;

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

export default function Chart({
  series,
  fmtY,
  bars = false,
}: {
  series: Series[];
  fmtY: (y: number) => string;
  bars?: boolean;
}) {
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">No data yet</p>;
  }

  // Bar mode stacks every series' value for a day into one column.
  const stacks = new Map<number, { color: string; y: number; label?: string }[]>();
  if (bars) {
    for (const s of series) {
      for (const p of s.points) {
        const arr = stacks.get(p.x) ?? [];
        arr.push({ color: s.color, y: p.y, label: p.label });
        stacks.set(p.x, arr);
      }
    }
  }

  const xs = all.map((p) => p.x);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = 0;
  const stackMax = bars
    ? Math.max(...Array.from(stacks.values()).map((a) => a.reduce((t, seg) => t + seg.y, 0)))
    : 0;
  const targetMax = Math.max(0, ...series.map((s) => s.target ?? 0));
  const yMax = (bars ? stackMax : Math.max(...all.map((p) => p.y), targetMax)) * 1.05 || 1;

  // Bars get half a day of breathing room each side so columns never clip.
  const dMin = bars ? xMin - DAY / 2 : xMin;
  const dMax = bars ? xMax + DAY / 2 : xMax;
  const px = (x: number) =>
    PAD.left + (dMax === dMin ? 0.5 : (x - dMin) / (dMax - dMin)) * (W - PAD.left - PAD.right);
  const py = (y: number) => H - PAD.bottom - ((y - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

  const yTicks = niceTicks(yMin, yMax, 4);
  // Date labels stepped in whole days, so equal label gaps mean equal time.
  const spanDays = Math.max(1, Math.round((xMax - xMin) / DAY));
  const dayStep = Math.max(1, Math.ceil(spanDays / 5));
  const xTicks: number[] = [];
  for (let t = xMin; t <= xMax + 1; t += dayStep * DAY) xTicks.push(t);

  const plotW = W - PAD.left - PAD.right;
  const barW = Math.min(16, (plotW / (spanDays + 1)) * 0.7);

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
      {bars
        ? Array.from(stacks.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([x, segs]) => {
              let cum = 0;
              return (
                <g key={x}>
                  {segs.map((seg, i) => {
                    const y0 = py(cum);
                    const y1 = py(cum + seg.y);
                    cum += seg.y;
                    return (
                      <rect
                        key={i}
                        x={px(x) - barW / 2}
                        y={y1}
                        width={barW}
                        height={Math.max(1, y0 - y1)}
                        fill={seg.color}
                        rx={1.5}
                      >
                        {seg.label && <title>{seg.label}</title>}
                      </rect>
                    );
                  })}
                </g>
              );
            })
        : series.map((s) => (
            <g key={s.name}>
              {s.points.length > 1 && (
                <polyline
                  points={s.points.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dash ? "6 5" : undefined}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {/* Markers show where sessions actually fall on the line. */}
              {s.points.map((p) => (
                <circle key={p.x} cx={px(p.x)} cy={py(p.y)} r={3} fill={s.color}>
                  {p.label && <title>{p.label}</title>}
                </circle>
              ))}
            </g>
          ))}
      {/* Goal lines (BPM mode): a record becomes a progress bar. */}
      {!bars &&
        series
          .filter((s) => s.target)
          .map((s) => (
            <g key={`t-${s.name}`}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={py(s.target!)}
                y2={py(s.target!)}
                stroke={s.color}
                strokeWidth={1}
                strokeDasharray="2 4"
                opacity={0.7}
              />
              <text x={W - PAD.right} y={py(s.target!) - 4} textAnchor="end" fontSize={10} fill={s.color} opacity={0.8}>
                goal {s.target}
              </text>
            </g>
          ))}
    </svg>
  );
}
