/** String-matching renderer: the text, the pattern aligned under it, and a helper table. */
import type { Mark, TextState } from '../core/step';
import { marksByIndex } from './markMeta';

/** Props for {@link TextView}. */
interface TextViewProps {
  state: TextState;
  marks: Mark[];
}

/**
 * Draws each letter in its own cell so indexes line up. The pattern row is shifted right by `state.shift`
 * cells, which shows the current alignment. The helper table (failure function, hashes, Z array) sits below.
 * @param props - text state and marks
 */
export function TextView({ state, marks }: TextViewProps) {
  const byIndex = marksByIndex(marks);
  const { text, pattern, shift, table, tableLabel } = state;
  return (
    <div className="text-view">
      <div className="text-scroll">
        <div className="text-rows">
          <div className="text-row" aria-label="Text">
            {[...text].map((ch, i) => (
              <span key={i} className="cell" data-mark={byIndex.get(i)?.top ?? 'none'}>
                <span className="cell-tag cell-idx">{i}</span>
                {ch}
              </span>
            ))}
          </div>
          {pattern && (
            <div className="text-row pattern-row" aria-label="Pattern" style={{ marginLeft: `calc(${Math.max(shift, 0)} * (var(--tc) + var(--tg)))` }}>
              {[...pattern].map((ch, i) => (
                <span key={i} className="cell" data-role="pattern">
                  {ch}
                </span>
              ))}
            </div>
          )}
        </div>
        {table && (
          <div className="text-table">
            <span className="tree-array-label">{tableLabel}</span>
            <div className="text-row">
              {table.map((v, i) => (
                <span key={i} className="cell" data-role="table" data-empty={v === '·'}>
                  <span className="cell-tag cell-idx">{i}</span>
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
