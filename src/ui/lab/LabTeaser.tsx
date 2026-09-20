/** Landing-page section: four sorting algorithms measured live on the same chart. */
import { useEffect, useState } from 'react';
import { REGISTRY } from '../../algorithms';
import { bestFit } from '../../core/fit';
import { metricOf } from '../../core/lab';
import { hrefFor } from '../../core/routes';
import { Link } from '../Link';
import { useInView } from '../useInView';
import { LabChart, type LabSeries } from './LabChart';
import { useLab } from './useLab';

/** Algorithms in the teaser with their line colors. */
const LINES: Array<[string, string]> = [
  ['bubble-sort', 'var(--m-swap)'],
  ['insertion-sort', 'var(--m-compare)'],
  ['merge-sort', 'var(--m-found)'],
  ['quick-sort', 'var(--m-frontier)'],
];

/**
 * Comparisons on random input for four sorts, measured in the browser when the section scrolls into view.
 * Each legend entry links to that algorithm's page.
 */
export function LabTeaser() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (inView) setStarted(true);
  }, [inView]);
  const defs = LINES.map(([id]) => REGISTRY.get(id)!);
  // Hooks are called in a fixed order; nothing is measured until the section has been seen.
  const d0 = useLab(started ? defs[0] : null);
  const d1 = useLab(started ? defs[1] : null);
  const d2 = useLab(started ? defs[2] : null);
  const d3 = useLab(started ? defs[3] : null);
  const series: LabSeries[] = [d0, d1, d2, d3].map((d, i) => {
    const points = (d?.points.random ?? []).map((p) => ({ x: p.x, y: metricOf(p, 'comparisons') }));
    return { id: LINES[i][0], label: defs[i].name, color: LINES[i][1], points, fit: points.length >= 3 ? bestFit(points) : null };
  });
  return (
    <section className="teaser" ref={ref}>
      <div className="teaser-copy" data-reveal>
        <h2>Watch n² fall behind <em>n log n.</em></h2>
        <p>Every algorithm page has a Complexity Lab. It runs the algorithm on growing inputs right in your browser, plots the time and memory it really used, and fits the curve.</p>
        <ul className="teaser-legend">
          {series.map((s) => (
            <li key={s.id} style={{ ['--tone' as string]: s.color }}>
              <Link href={hrefFor({ id: s.id })}>
                <i aria-hidden="true" />
                {s.label}
                {s.fit && <b>≈ {s.fit.cls.label}</b>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="teaser-chart" data-reveal style={{ ['--i' as string]: 1 }}>
        <LabChart series={series} xLabel="input size (elements)" yLabel="comparisons on random input" size="sm" />
      </div>
    </section>
  );
}
