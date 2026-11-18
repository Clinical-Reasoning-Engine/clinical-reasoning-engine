import type { Vitals } from "@/lib/sim";

type Series = { label: string; values: Vitals[]; color: string; dashed?: boolean };
type Metric = "map" | "hr";

const W = 360;
const H = 180;
const PAD = { left: 36, right: 12, top: 28, bottom: 26 };
const MAX_HOUR = 6;
const TITLES: Record<Metric, string> = { map: "MAP (mmHg)", hr: "Heart rate (bpm)" };

/** Small SVG line chart of one vital by hour. MAP gets its 65 mmHg goal line. */
export function TrendChart({ metric, series }: { metric: Metric; series: Series[] }) {
  const values = series.flatMap((s) => s.values.map((v) => v[metric]));
  const goal = metric === "map" ? 65 : null;
  const span = [...values, ...(goal ? [goal] : [])];
  // Zoom to the data (at least a 20-unit window) so hour-to-hour changes are visible.
  let lo = Math.floor((Math.min(...span) - 3) / 5) * 5;
  let hi = Math.ceil((Math.max(...span) + 3) / 5) * 5;
  if (hi - lo < 20) {
    const mid = (hi + lo) / 2;
    lo = Math.floor((mid - 10) / 5) * 5;
    hi = lo + 20;
  }
  const x = (h: number) => PAD.left + (h / MAX_HOUR) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const line = (vals: number[]) => vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const step = hi - lo > 40 ? 20 : hi - lo > 20 ? 10 : 5;
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += step) ticks.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${TITLES[metric]} by hour`}>
      <text x={PAD.left} y={14} fontSize="12" fontWeight="600" fill="#d4d4d8">
        {TITLES[metric]}
      </text>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#27323d" />
          <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#8a9aa9">
            {v}
          </text>
        </g>
      ))}
      {Array.from({ length: MAX_HOUR + 1 }, (_, h) => (
        <text key={h} x={x(h)} y={H - 8} textAnchor="middle" fontSize="10" fill="#8a9aa9">
          h{h}
        </text>
      ))}
      {goal !== null && (
        <g>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(goal)} y2={y(goal)} stroke="#f2a65a" strokeDasharray="4 4" />
          <text x={PAD.left + 4} y={y(goal) - 5} fontSize="10" fill="#f2a65a">
            goal 65
          </text>
        </g>
      )}
      {series.map((s) => (
        <g key={s.label}>
          <path
            d={line(s.values.map((v) => v[metric]))}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeDasharray={s.dashed ? "6 5" : undefined}
          />
          {s.values.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v[metric])} r="3.5" fill={s.color} />
          ))}
        </g>
      ))}
    </svg>
  );
}
