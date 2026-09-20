/** Table renderer: DP tables, sieve, stacks and queues, permutation rows. */
import type { Mark, TableState } from '../core/step';
import { marksByIndex } from './markMeta';

/** Props for {@link CellsView}. */
interface CellsViewProps {
  state: TableState;
  marks: Mark[];
}

/**
 * Draws a labeled grid of cells. Marks use the flat index `row * cols + col`; labels attached to marks
 * (top, front, back) are drawn above the cell. Wide tables scroll sideways instead of shrinking the text.
 * @param props - the table and this step's marks
 */
export function CellsView({ state, marks }: CellsViewProps) {
  const byIndex = marksByIndex(marks);
  const { rows, cols, cells, rowLabels, colLabels, caption } = state;
  const hasRowLabels = !!rowLabels?.some(Boolean);
  const dense = cols > 12;
  return (
    <div className="cells-view" data-dense={dense}>
      {caption && <p className="cells-caption">{caption}</p>}
      <div className="cells-scroll">
        <div
          className="cells-grid"
          role="table"
          aria-label={caption ?? 'Table'}
          style={{ gridTemplateColumns: `${hasRowLabels ? 'minmax(4.5rem, max-content) ' : ''}repeat(${cols}, minmax(var(--cell-min), 1fr))` }}
        >
          {colLabels && (
            <>
              {hasRowLabels && <span className="cells-corner" />}
              {colLabels.map((c, i) => (
                <span key={i} className="cells-col-label">{c}</span>
              ))}
            </>
          )}
          {Array.from({ length: rows }, (_, r) => (
            <div className="cells-row" role="row" key={r}>
              {hasRowLabels && <span className="cells-row-label" title={rowLabels?.[r]}>{rowLabels?.[r]}</span>}
              {Array.from({ length: cols }, (_, c) => {
                const i = r * cols + c;
                const m = byIndex.get(i);
                const v = cells[i];
                return (
                  <span className="cell" role="cell" key={c} data-mark={m?.top ?? 'none'} data-empty={v === null || v === ''}>
                    {m?.labels.length ? <span className="cell-tag">{m.labels.join(' ')}</span> : null}
                    {v === null ? '' : String(v)}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
