/** Array renderer for sorting and searching: bars or a row of boxes, with elements that slide when they move. */
import type { Mark } from '../core/step';
import type { ArrayMode } from '../ui/useArrayMode';
import { useWidth } from '../ui/useWidth';
import { marksByIndex } from './markMeta';

/** Props for {@link BarsView}. */
interface BarsViewProps {
  /** Values to draw. */
  array: number[];
  /** Highlights for this step. */
  marks: Mark[];
  /** Search target; matching values get an underline or ring so it is easy to track. */
  target?: number;
  /** Stable element ids for this step (see `core/identity`). Without them, elements are keyed by position. */
  ids?: number[];
  /** Bars (default) or boxes. */
  mode?: ArrayMode;
}

/** Widest a slot gets, so a handful of values does not produce giant bars or boxes. */
const MAX_SLOT = 64;
/** Narrowest box before the array wraps onto another row. */
const MIN_BOX = 44;

/**
 * Draws the array. Every element sits in an absolutely positioned slot keyed by its identity, and its
 * position is a CSS transform, so when an element changes position it slides there (a swap is two
 * elements trading places). The slide duration follows the playback speed through `--move`.
 * When a `range` mark is present, unmarked elements are dimmed so the active window stands out.
 * @param props - array, marks, target, identities, and mode
 */
export function BarsView({ array, marks, target, ids, mode = 'bars' }: BarsViewProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const byIndex = marksByIndex(marks);
  const hasRange = marks.some((m) => m.kind === 'range');
  const n = array.length;
  const min = Math.min(...array, 0);
  const max = Math.max(...array, 1);
  const span = max - min || 1;

  if (n === 0) return <div className="empty">The array is empty. Add some numbers to begin.</div>;

  // Boxes wrap onto balanced rows when they would get too narrow.
  const perRow = Math.max(1, Math.min(n, Math.floor(width / MIN_BOX)));
  const rows = mode === 'cells' ? Math.ceil(n / perRow) : 1;
  const cols = mode === 'cells' ? Math.ceil(n / rows) : n;
  const label = `Array of ${n} numbers: ${array.slice(0, 12).join(', ')}${n > 12 ? ', and more' : ''}`;

  return (
    <div className="arr-wrap" ref={ref}>
      <div
        className={mode === 'cells' ? 'arr' : 'bars'}
        data-dense={n > 32}
        role="img"
        aria-label={label}
        style={{ ['--n' as string]: cols, ['--rows' as string]: rows, width: `min(100%, ${cols * MAX_SLOT}px)` }}
      >
        {array.map((v, i) => {
          const m = byIndex.get(i);
          const key = ids?.[i] ?? i;
          const common = {
            'data-mark': m?.top ?? 'none',
            'data-dim': hasRange && !m,
            'data-target': target !== undefined && v === target,
          };
          if (mode === 'cells') {
            return (
              <div key={key} {...common} className="arr-slot" style={{ ['--c' as string]: i % cols, ['--r' as string]: Math.floor(i / cols) }}>
                <span className="arr-tags">{m?.labels.join(' ')}</span>
                <span className="arr-box">{v}</span>
                <span className="arr-idx">{i}</span>
              </div>
            );
          }
          return (
            <div key={key} {...common} className="bar-col" style={{ ['--k' as string]: i }}>
              <div className="bar-tags">{m?.labels.map((l) => <span key={l}>{l}</span>)}</div>
              {n <= 32 && <span className="bar-val">{v}</span>}
              <div className="bar" style={{ height: `${10 + (90 * (v - min)) / span}%` }} />
              {n <= 32 && <span className="bar-idx">{i}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
