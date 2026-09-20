/** Stats tab chart: every counter as a small area chart over the steps, with a playhead you can drag. */
import { useRef } from 'react';
import type { Step } from '../../core/step';
import { metricLabel } from '../../core/lab';
import { compact } from './LabChart';

/** Props for {@link CounterTimeline}. */
interface CounterTimelineProps {
  steps: Step<unknown>[];
  index: number;
  onSeek: (i: number) => void;
}

/** Samples drawn per row; long runs are thinned to this many. */
const SAMPLES = 240;

/**
 * One row per counter, each on its own scale, sharing a playhead. Counters only ever grow, so the
 * shape shows where in the run the work happens. Clicking or dragging anywhere seeks the player.
 * @param props - the run, the current step, and the seek callback
 */
export function CounterTimeline({ steps, index, onSeek }: CounterTimelineProps) {
  const box = useRef<HTMLDivElement>(null);
  const keys = Object.keys(steps[steps.length - 1]?.stats ?? {});
  if (!keys.length || steps.length < 2) return <p className="dim">This algorithm has no counters.</p>;
  const n = steps.length;
  const idx = Array.from({ length: Math.min(SAMPLES, n) }, (_, i) => Math.round((i * (n - 1)) / (Math.min(SAMPLES, n) - 1 || 1)));
  const head = (index / (n - 1)) * 100;

  /** Converts a pointer position to a step and seeks there. */
  const seekAt = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    onSeek(Math.round(Math.min(Math.max((clientX - r.left) / r.width, 0), 1) * (n - 1)));
  };

  return (
    <div
      className="timeline"
      ref={box}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        seekAt(e.clientX);
      }}
      onPointerMove={(e) => e.buttons === 1 && seekAt(e.clientX)}
      role="group"
      aria-label="Counters over the run. Click to jump to a step."
    >
      {keys.map((k) => {
        const max = Math.max(steps[n - 1].stats[k] ?? 0, 1);
        const pts = idx.map((i, j) => `${((j / (idx.length - 1 || 1)) * 100).toFixed(2)},${(30 - ((steps[i].stats[k] ?? 0) / max) * 26).toFixed(2)}`);
        return (
          <div className="tl-row" key={k}>
            <div className="tl-head">
              <span>{k === 'memory' ? 'peak memory' : metricLabel(k)}</span>
              <b>{compact(steps[index].stats[k] ?? 0)}</b>
            </div>
            <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
              <polygon className="tl-area" points={`0,32 ${pts.join(' ')} 100,32`} />
              <polyline className="tl-line" points={pts.join(' ')} vectorEffect="non-scaling-stroke" />
              <rect className="tl-future" x={head} y="0" width={100 - head} height="32" />
            </svg>
          </div>
        );
      })}
      <span className="tl-head-line" style={{ left: `${head}%` }} aria-hidden="true" />
    </div>
  );
}
