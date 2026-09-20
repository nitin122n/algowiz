/** SVG line chart for the Complexity Lab: measured points, fitted curves, and a live marker for the current run. */
import type { Fit } from '../../core/fit';

/** One line on the chart. */
export interface LabSeries {
  id: string;
  label: string;
  /** CSS color, usually a custom property. */
  color: string;
  points: Array<{ x: number; y: number }>;
  /** Best-fitting growth curve, drawn dashed behind the points. */
  fit?: Fit | null;
  /** Draw the measured line dashed (used for the compare overlay). */
  dashed?: boolean;
}

/** Where the user's own run sits: its size, the value so far, and where it will end. */
export interface LabMarker {
  x: number;
  y: number;
  final: number;
}

/** Props for {@link LabChart}. */
interface LabChartProps {
  series: LabSeries[];
  marker?: LabMarker | null;
  xLabel: string;
  yLabel: string;
  /** `lg` is the expanded view. */
  size?: 'sm' | 'lg';
}

/**
 * A "nice" upper bound and tick step for an axis, such as 0, 250, 500, 750, 1000.
 * @param max - largest value to fit
 * @param count - rough number of ticks wanted
 */
export function niceScale(max: number, count = 4): { top: number; step: number } {
  if (max <= 0) return { top: 1, step: 1 };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) as number;
  return { top: Math.ceil(max / step) * step, step };
}

/**
 * Short number for tick labels: 1200 becomes 1.2k.
 * @param v - value
 */
export function compact(v: number): string {
  if (Math.abs(v) >= 1e6) return `${+(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `${+(v / 1e3).toFixed(1)}k`;
  return `${+v.toFixed(v < 10 && v % 1 ? 1 : 0)}`;
}

/**
 * Draws the chart. The x axis runs over input sizes, the y axis over the chosen counter.
 * Points appear with a small pop as they are measured; fitted curves are clipped at the top.
 * @param props - series, marker, axis labels, and size
 */
export function LabChart({ series, marker, xLabel, yLabel, size = 'sm' }: LabChartProps) {
  const W = size === 'lg' ? 760 : 360;
  const H = size === 'lg' ? 380 : 230;
  const P = { l: 42, r: 14, t: 14, b: 34 };
  const xs = series.flatMap((s) => s.points.map((p) => p.x)).concat(marker ? [marker.x] : []);
  const ys = series.flatMap((s) => s.points.map((p) => p.y)).concat(marker ? [marker.final] : []);
  const xMin = xs.length ? Math.min(...xs) : 0;
  const xMax = xs.length ? Math.max(...xs, xMin + 1) : 1;
  const { top, step } = niceScale(Math.max(...ys, 1));
  /** Maps a size to an x coordinate. */
  const px = (x: number) => P.l + ((x - xMin) / (xMax - xMin || 1)) * (W - P.l - P.r);
  /** Maps a value to a y coordinate; values far above the top are clamped just past it. */
  const py = (y: number) => H - P.b - (Math.min(y, top * 1.08) / top) * (H - P.t - P.b);
  const yTicks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const xTicks = [...new Set(xs)].sort((a, b) => a - b);
  const everyX = Math.ceil(xTicks.length / (size === 'lg' ? 10 : 6));

  return (
    <svg className="lab-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${yLabel} against ${xLabel}. ${series.map((s) => `${s.label}: ${s.points.length} points${s.fit ? `, grows like ${s.fit.cls.label}` : ''}`).join('. ')}.`}>
      <defs>
        {series.map((s) => (
          <linearGradient key={s.id} id={`lab-fill-${s.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
        <clipPath id={`lab-clip-${size}`}>
          <rect x={P.l} y={P.t - 4} width={W - P.l - P.r + 4} height={H - P.t - P.b + 4} />
        </clipPath>
      </defs>
      {yTicks.map((t) => (
        <g key={t}>
          <line className="lab-grid" x1={P.l} x2={W - P.r} y1={py(t)} y2={py(t)} />
          <text className="lab-tick" x={P.l - 6} y={py(t)} textAnchor="end" dominantBaseline="central">{compact(t)}</text>
        </g>
      ))}
      {xTicks.map((x, i) =>
        i % everyX === 0 || i === xTicks.length - 1 ? (
          <text key={x} className="lab-tick" x={px(x)} y={H - P.b + 14} textAnchor="middle">{compact(x)}</text>
        ) : null,
      )}
      <text className="lab-axis" x={(P.l + W - P.r) / 2} y={H - 4} textAnchor="middle">{xLabel}</text>

      <g clipPath={`url(#lab-clip-${size})`}>
        {series.map((s) => {
          if (!s.fit || s.points.length < 3) return null;
          const f = s.fit;
          const d = Array.from({ length: 48 }, (_, i) => xMin + ((xMax - xMin) * i) / 47)
            .map((x, i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)} ${py(f.c * f.cls.fn(x)).toFixed(1)}`)
            .join(' ');
          return <path key={`fit-${s.id}`} className="lab-fit" d={d} style={{ stroke: s.color }} />;
        })}
        {series.map((s) => {
          if (!s.points.length) return null;
          const line = s.points.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`).join(' ');
          const area = `${line} L${px(s.points[s.points.length - 1].x).toFixed(1)} ${py(0)} L${px(s.points[0].x).toFixed(1)} ${py(0)} Z`;
          return (
            <g key={s.id} className="lab-series" data-dashed={!!s.dashed}>
              {!s.dashed && <path className="lab-area" d={area} fill={`url(#lab-fill-${s.id})`} />}
              <path className="lab-line" d={line} style={{ stroke: s.color }} />
              {s.points.map((p) => (
                <circle key={p.x} className="lab-pt" cx={px(p.x)} cy={py(p.y)} r={size === 'lg' ? 4 : 3} style={{ fill: s.color }} />
              ))}
            </g>
          );
        })}
      </g>

      {marker && (
        <g className="lab-marker">
          <line x1={px(marker.x)} x2={px(marker.x)} y1={py(0)} y2={py(marker.final)} />
          <circle className="lab-marker-final" cx={px(marker.x)} cy={py(marker.final)} r={size === 'lg' ? 7 : 5.5} />
          <circle className="lab-marker-pulse" cx={px(marker.x)} cy={py(marker.y)} r={size === 'lg' ? 7 : 5} />
          <circle className="lab-marker-dot" cx={px(marker.x)} cy={py(marker.y)} r={size === 'lg' ? 5 : 3.8} />
        </g>
      )}
    </svg>
  );
}
