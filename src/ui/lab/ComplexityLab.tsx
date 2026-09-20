/** The Complexity Lab: measured time and space growth, fitted curves, a compare overlay, and the user's live run. */
import { ArrowsOut, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { REGISTRY } from '../../algorithms';
import { bestFit } from '../../core/fit';
import { defaultTimeMetric, metricLabel, metricOf, STEPS } from '../../core/lab';
import { scaleFor } from '../../core/scale';
import type { AlgorithmDef, Step } from '../../core/step';
import { GrowthChart } from '../GrowthChart';
import { LabChart, type LabMarker, type LabSeries } from './LabChart';
import { useLab } from './useLab';

/** Colors for shapes, by how many shapes an algorithm has. Sorted input reads as "easy" green, reversed as "hard" coral. */
const TONES: Record<number, string[]> = {
  1: ['var(--fam)'],
  2: ['var(--fam)', 'var(--m-swap)'],
  3: ['var(--m-found)', 'var(--fam)', 'var(--m-swap)'],
};
/** Color of the compare overlay. */
const COMPARE_TONE = 'var(--text)';

/** Props for {@link ComplexityLab}. */
interface ComplexityLabProps {
  def: AlgorithmDef<any, any>;
  steps: Step<any>[];
  index: number;
  /** The input of the current run, or null while the form is invalid. */
  input: unknown;
}

/** Time or space view. */
type Mode = 'time' | 'space';

/**
 * Measures the algorithm at many sizes and plots the results live. The user's own run appears as a marker
 * that climbs as the player advances. An expanded view shows the same chart larger.
 * @param props - algorithm, current run, and its input
 */
export function ComplexityLab({ def, steps, index, input }: ComplexityLabProps) {
  const spec = scaleFor(def);
  const data = useLab(def);
  const [mode, setMode] = useState<Mode>('time');
  const [metric, setMetric] = useState<string | null>(null);
  const [compareId, setCompareId] = useState('');
  const [expanded, setExpanded] = useState(false);
  const compareDef = compareId ? REGISTRY.get(compareId) : null;
  const cmp = useLab(compareDef);

  const keys = useMemo(() => {
    const all = new Set<string>();
    Object.values(data?.points ?? {}).forEach((pts) => pts.forEach((p) => Object.keys(p.stats).forEach((k) => all.add(k))));
    Object.keys(steps[steps.length - 1]?.stats ?? {}).forEach((k) => all.add(k));
    return [...all];
  }, [data, steps]);
  const timeKeys = [...keys.filter((k) => k !== 'memory'), STEPS];
  const timeMetric = metric && timeKeys.includes(metric) ? metric : defaultTimeMetric(keys);
  const active = mode === 'space' ? 'memory' : timeMetric;
  const spaceMeasured = keys.includes('memory');

  // Close the expanded view with Escape.
  useEffect(() => {
    if (!expanded) return;
    /** Closes on Escape. */
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  if (!spec || !data) {
    return (
      <section className="lab">
        <header className="lab-head"><h3>Complexity</h3></header>
        <p className="dim lab-note">This algorithm has no single size to grow, so it cannot be measured. Here is the shape its theory predicts.</p>
        <GrowthChart complexity={def.complexity} />
      </section>
    );
  }

  const tones = TONES[spec.shapes.length] ?? TONES[3];
  const series: LabSeries[] = spec.shapes.map((s, i) => {
    const points = (data.points[s.id] ?? []).map((p) => ({ x: p.x, y: metricOf(p, active) }));
    return { id: s.id, label: s.label, color: tones[i], points, fit: points.length >= 3 ? bestFit(points) : null };
  });
  // Compare against the other algorithm's matching shape (or its first shape).
  const cmpSpec = compareDef ? scaleFor(compareDef) : null;
  const mainShape = spec.shapes.find((s) => s.seeds > 1) ?? spec.shapes[0];
  const cmpShape = cmpSpec?.shapes.find((s) => s.id === mainShape.id) ?? cmpSpec?.shapes.find((s) => s.seeds > 1) ?? cmpSpec?.shapes[0];
  const cmpPts = cmpShape ? cmp?.points[cmpShape.id] ?? [] : [];
  const cmpHasMetric = cmpPts.length === 0 || active === STEPS || active in cmpPts[0].stats;
  if (compareDef && cmpShape && cmpHasMetric) {
    const points = cmpPts.map((p) => ({ x: p.x, y: metricOf(p, active) }));
    series.push({ id: 'compare', label: `${compareDef.name} (${cmpShape.label.toLowerCase()})`, color: COMPARE_TONE, points, dashed: true, fit: points.length >= 3 ? bestFit(points) : null });
  }

  // The live marker: the user's run at its size, climbing with the player.
  let marker: LabMarker | null = null;
  try {
    if (input !== null && steps.length) {
      /** The metric's value at step i (steps count from 1). */
      const at = (i: number) => (active === STEPS ? i + 1 : steps[i].stats[active] ?? 0);
      marker = { x: spec.sizeOf(input), y: at(index), final: at(steps.length - 1) };
    }
  } catch {
    marker = null;
  }

  // Verdict from the most representative shape (the averaged random one when present).
  const main = series.find((x) => x.id === mainShape.id) ?? series[0];
  const theory = mode === 'space' ? `O(${stripO(def.complexity.space)})` : `best ${def.complexity.best}, average ${def.complexity.average}, worst ${def.complexity.worst}`;
  const measuring = data.done < data.total;
  const siblings = REGISTRY.all.filter((d) => d.id !== def.id && d.family === def.family && scaleFor(d) && scaleFor(d)?.unit === spec.unit);

  /** Controls, chart, legend, and verdict; rendered inline and again in the larger view. */
  const body = (size: 'sm' | 'lg') => (
    <>
      <div className="lab-controls">
        <div className="seg" role="radiogroup" aria-label="Measure">
          <button role="radio" aria-checked={mode === 'time'} data-on={mode === 'time'} onClick={() => setMode('time')}>Time</button>
          <button role="radio" aria-checked={mode === 'space'} data-on={mode === 'space'} onClick={() => setMode('space')}>Space</button>
        </div>
        {mode === 'time' && (
          <label className="lab-select">
            <span className="sr-only">Counter</span>
            <select value={timeMetric} onChange={(e) => setMetric(e.target.value)}>
              {timeKeys.map((k) => (
                <option key={k} value={k}>{metricLabel(k)}</option>
              ))}
            </select>
          </label>
        )}
        {siblings.length > 0 && (
          <label className="lab-select">
            <span className="sr-only">Compare with</span>
            <select value={compareId} onChange={(e) => setCompareId(e.target.value)}>
              <option value="">Compare with...</option>
              {siblings.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {mode === 'space' && !spaceMeasured ? (
        <>
          <p className="dim lab-note">Space is not measured for this algorithm. Theory says {theory}.</p>
          <GrowthChart complexity={{ best: def.complexity.space, average: def.complexity.space, worst: def.complexity.space, space: def.complexity.space }} />
        </>
      ) : (
        <>
          <div className="lab-plot">
            <LabChart series={series} marker={marker} xLabel={`input size (${spec.unit})`} yLabel={metricLabel(active)} size={size} />
            {measuring && (
              <div className="lab-progress" role="status">
                <span style={{ transform: `scaleX(${data.done / data.total})` }} />
                <em>Measuring {data.done} of {data.total} runs</em>
              </div>
            )}
          </div>
          <ul className="lab-legend">
            {series.map((s) => (
              <li key={s.id} data-dashed={!!s.dashed} style={{ ['--tone' as string]: s.color }}>
                <i aria-hidden="true" />
                <span>{s.label}</span>
                {s.fit && <b>≈ {s.fit.cls.label}</b>}
              </li>
            ))}
            {marker && (
              <li className="lab-you">
                <i aria-hidden="true" />
                <span>Your run: {spec.unit} {marker.x}, {Math.round(marker.y)} {metricLabel(active)} so far</span>
              </li>
            )}
          </ul>
          <p className="lab-verdict">
            {main?.fit ? (
              <>Measured {metricLabel(active)} on {main.label.toLowerCase()} grows like <b>{main.fit.cls.label === '1' ? 'a constant' : main.fit.cls.label}</b>. Theory: {theory}.</>
            ) : (
              <>Collecting measurements. Theory: {theory}.</>
            )}
          </p>
          {compareDef && !cmpHasMetric && <p className="dim lab-note">{compareDef.name} has no "{metricLabel(active)}" counter. Choose "recorded steps" to compare them.</p>}
          <details className="lab-data">
            <summary>Show measurements</summary>
            <DataTable series={series} />
          </details>
        </>
      )}
    </>
  );

  return (
    <section className="lab" aria-label="Complexity Lab">
      <header className="lab-head">
        <h3>Complexity Lab</h3>
        <button className="icon-btn" onClick={() => setExpanded(true)} aria-label="Open the lab in a larger view" title="Larger view">
          <ArrowsOut size={16} weight="bold" />
        </button>
      </header>
      {body('sm')}
      {/* Portaled to <body> so no sticky ancestor's stacking context can put the dock above it. */}
      {expanded && createPortal(
        <div className="palette-backdrop lab-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setExpanded(false)}>
          <div className="lab-modal" role="dialog" aria-modal="true" aria-label={`Complexity Lab: ${def.name}`}>
            <header className="lab-head">
              <h3>Complexity Lab: {def.name}</h3>
              <button className="icon-btn" onClick={() => setExpanded(false)} aria-label="Close" autoFocus>
                <X size={18} weight="bold" />
              </button>
            </header>
            {body('lg')}
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}

/** Removes a leading "O(" and trailing ")" so strings can be re-wrapped. */
function stripO(s: string): string {
  return s.replace(/^O\((.*)\)$/, '$1');
}

/** Accessible table of every measured value, one column per series. */
function DataTable({ series }: { series: LabSeries[] }) {
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))].sort((a, b) => a - b);
  return (
    <div className="lab-table-wrap">
      <table className="lab-table">
        <thead>
          <tr>
            <th scope="col">Size</th>
            {series.map((s) => (
              <th scope="col" key={s.id}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xs.map((x) => (
            <tr key={x}>
              <th scope="row">{x}</th>
              {series.map((s) => {
                const p = s.points.find((q) => q.x === x);
                return <td key={s.id}>{p ? +p.y.toFixed(1) : ''}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
