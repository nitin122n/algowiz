/** Linked-list renderer: nodes joined by arrows, with head, null, and circular return marker. */
import type { ListKind, Mark } from '../core/step';
import { marksByIndex } from './markMeta';

/** Props for {@link ListView}. */
interface ListViewProps {
  /** Node values in order. */
  nodes: number[];
  /** Pointer style. */
  kind: ListKind;
  /** Highlights for this step. */
  marks: Mark[];
}

/**
 * Draws the list left to right. Singly lists end in `null`; doubly lists use two-way arrows and
 * a `null` on both ends; circular lists show a loop arrow from the last node back to the head.
 * @param props - nodes, kind, and marks
 */
export function ListView({ nodes, kind, marks }: ListViewProps) {
  const byIndex = marksByIndex(marks);
  const link = <span className="ll-link" data-kind={kind} aria-hidden="true" />;
  return (
    <div className="list-view" role="img" aria-label={`${kind} linked list: ${nodes.length ? nodes.join(', ') : 'empty'}`}>
      <div className="ll-row">
        {kind === 'doubly' && (
          <>
            <span className="ll-null">null</span>
            {link}
          </>
        )}
        {nodes.length === 0 && <span className="ll-empty">head points at null</span>}
        {nodes.map((v, i) => {
          const m = byIndex.get(i);
          return (
            <div className="ll-item" key={i}>
              <div className="ll-node">
                <div className="ll-tags">
                  {i === 0 && <span className="tag-head">head</span>}
                  {m?.labels.map((l) => <span key={l}>{l}</span>)}
                </div>
                <div className="ll-box" data-mark={m?.top ?? 'none'}>{v}</div>
                <span className="ll-idx">{i}</span>
              </div>
              {(i < nodes.length - 1 || kind !== 'circular') && link}
            </div>
          );
        })}
        {nodes.length > 0 && kind !== 'circular' && <span className="ll-null">null</span>}
      </div>
      {kind === 'circular' && nodes.length > 0 && <div className="ll-loop"><span>last node points back to head</span></div>}
    </div>
  );
}
