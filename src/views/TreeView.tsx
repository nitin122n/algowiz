/** Tree renderer: binary trees by in-order rank, general trees by subtree width, forests side by side. */
import type { Mark, TreeState } from '../core/step';
import { marksByIndex } from './markMeta';

/** Props for {@link TreeView}. */
interface TreeViewProps {
  state: TreeState;
  marks: Mark[];
}

/** Horizontal distance between neighboring slots and vertical distance between levels (viewBox units). */
const GAP_X = 62;
const GAP_Y = 78;
const RADIUS = 20;

/** Node position in tree coordinates. */
interface Pos {
  x: number;
  y: number;
}

/**
 * Computes positions for every node.
 * Binary trees use in-order rank for x, which keeps left children left of parents and never overlaps.
 * Other trees give each subtree the width of its leaves.
 */
function layout(state: TreeState): Record<number, Pos> {
  const pos: Record<number, Pos> = {};
  let cursor = 0;
  if (state.binary) {
    const walk = (id: number | null, depth: number): void => {
      if (id === null) return;
      const n = state.nodes[id];
      walk(n.children[0] ?? null, depth + 1);
      pos[id] = { x: cursor++, y: depth };
      walk(n.children[1] ?? null, depth + 1);
    };
    state.roots.forEach((r) => walk(r, 0));
    return pos;
  }
  /** Places a subtree starting at the cursor; returns its x center. */
  const place = (id: number, depth: number): number => {
    const kids = state.nodes[id].children.filter((c): c is number => c !== null);
    if (!kids.length) {
      pos[id] = { x: cursor++, y: depth };
      return pos[id].x;
    }
    const xs = kids.map((k) => place(k, depth + 1));
    pos[id] = { x: (xs[0] + xs[xs.length - 1]) / 2, y: depth };
    return pos[id].x;
  };
  state.roots.forEach((r) => place(r, 0));
  return pos;
}

/**
 * Draws the tree as SVG, plus the optional array below it (heap storage, union-find parents).
 * @param props - tree state and marks
 */
export function TreeView({ state, marks }: TreeViewProps) {
  const byIndex = marksByIndex(marks);
  const pos = layout(state);
  const ids = Object.keys(pos).map(Number);
  if (!ids.length) return <div className="empty">The tree is empty.</div>;
  const maxX = Math.max(...ids.map((i) => pos[i].x));
  const maxY = Math.max(...ids.map((i) => pos[i].y));
  const w = Math.max(maxX, 3) * GAP_X + RADIUS * 2 + 24;
  const h = maxY * GAP_Y + RADIUS * 2 + 44;
  const px = (id: number) => (pos[id].x + (maxX < 3 ? (3 - maxX) / 2 : 0)) * GAP_X + RADIUS + 12;
  const py = (id: number) => pos[id].y * GAP_Y + RADIUS + 8;
  return (
    <div className="tree-view">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Tree with ${ids.length} nodes`} style={{ maxWidth: `${Math.min(w * 1.15, 1000)}px` }}>
        {ids.flatMap((id) =>
          state.nodes[id].children.map((c, k) =>
            c !== null && pos[c] ? <line key={`${id}-${k}`} className="tree-edge" x1={px(id)} y1={py(id)} x2={px(c)} y2={py(c)} /> : null,
          ),
        )}
        {ids.map((id) => {
          const n = state.nodes[id];
          const m = byIndex.get(id);
          return (
            <g key={id} className="tnode" data-mark={m?.top ?? 'none'} data-color={n.color} transform={`translate(${px(id)} ${py(id)})`}>
              <circle r={RADIUS} />
              <text className="tnode-label" textAnchor="middle" dominantBaseline="central">{n.label}</text>
              {n.sub && <text className="tnode-sub" textAnchor="middle" y={RADIUS + 14}>{n.sub}</text>}
              {m?.labels.length ? <text className="tnode-tag" textAnchor="middle" y={-RADIUS - 6}>{m.labels.join(' ')}</text> : null}
            </g>
          );
        })}
      </svg>
      {state.array && (
        <div className="tree-array">
          <span className="tree-array-label">{state.arrayLabel}</span>
          <div className="tree-array-cells">
            {state.array.map((v, i) => (
              <span key={i} className="cell" data-mark={state.arrayIsNodeIds ? byIndex.get(i)?.top ?? 'none' : 'none'}>
                <span className="cell-tag cell-idx">{i}</span>
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
