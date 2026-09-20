/** Growth-rate chart: how the algorithm's best, average, and worst cases scale with input size. */
import { growthOf } from '../core/growth';
import type { Complexity } from '../core/step';

/** Largest input size drawn. */
const N_MAX = 20;
/** Chart size in viewBox units. */
const W = 320;
const H = 170;
const PAD = { l: 8, r: 8, t: 10, b: 20 };
/** Operation count at the top of the chart; steeper curves are clipped. */
const Y_MAX = 400;

/**
 * Builds an SVG path for a growth function.
 * @param fn - operations for input size n
 */
function pathFor(fn: (n: number) => number): string {
  const pts: string[] = [];
  for (let n = 1; n <= N_MAX; n += 0.5) {
    const x = PAD.l + ((n - 1) / (N_MAX - 1)) * (W - PAD.l - PAD.r);
    const y = H - PAD.b - (Math.min(fn(n), Y_MAX * 1.2) / Y_MAX) * (H - PAD.t - PAD.b);
    pts.push(`${pts.length ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Props for {@link GrowthChart}. */
interface GrowthChartProps {
  complexity: Complexity;
}

/**
 * Draws faint reference curves (n, n log n, n²) and the algorithm's own best, average, and worst curves.
 * Cases that coincide are drawn once. Each line is also listed below so color is never the only signal.
 * @param props - the algorithm's complexity strings
 */
export function GrowthChart({ complexity }: GrowthChartProps) {
  const cases = [
    { key: 'best', label: 'Best', text: complexity.best },
    { key: 'average', label: 'Average', text: complexity.average },
    { key: 'worst', label: 'Worst', text: complexity.worst },
  ].map((c) => ({ ...c, g: growthOf(c.text) }));
  const refs = [
    { label: 'n', fn: (n: number) => n },
    { label: 'n log n', fn: (n: number) => n * Math.log2(n + 1) },
    { label: 'n²', fn: (n: number) => n * n },
  ];
  return (
    <figure className="growth">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Growth of operations with input size from 1 to ${N_MAX}. ${cases.map((c) => `${c.label} case ${c.text}`).join('. ')}.`}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} className="growth-grid" x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b - f * (H - PAD.t - PAD.b)} y2={H - PAD.b - f * (H - PAD.t - PAD.b)} />
        ))}
        {refs.map((r) => (
          <path key={r.label} className="growth-ref" d={pathFor(r.fn)} />
        ))}
        {cases.map((c) => (c.g ? <path key={c.key} className="growth-line" data-case={c.key} d={pathFor(c.g.fn)} /> : null))}
        <text className="growth-axis" x={PAD.l} y={H - 5}>1</text>
        <text className="growth-axis" x={W - PAD.r} y={H - 5} textAnchor="end">n = {N_MAX}</text>
        <text className="growth-axis" x={W - PAD.r} y={PAD.t + 4} textAnchor="end">n²</text>
      </svg>
      <figcaption>
        <ul className="growth-legend">
          {cases.map((c) => (
            <li key={c.key} data-case={c.key}>
              <span className="growth-key" />
              {c.label} <b>{c.text}</b>
              {c.g ? <span className="dim"> ({c.g.name})</span> : <span className="dim"> (cannot be drawn)</span>}
            </li>
          ))}
        </ul>
        <p className="dim growth-note">Faint lines show n, n log n, and n² for comparison. Steeper curves run off the top.</p>
      </figcaption>
    </figure>
  );
}
