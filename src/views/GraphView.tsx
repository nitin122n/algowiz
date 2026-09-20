/** Graph renderer: nodes on a circle, edges with weights and arrowheads. */
import type { GraphState, MarkKind, Mark } from '../core/step';
import { edgeKey } from '../core/step';
import { marksByIndex } from './markMeta';

/** Props for {@link GraphView}. */
interface GraphViewProps {
  state: GraphState;
  marks: Mark[];
}

/** Node circle radius in viewBox units. */
const R = 6;
/** Edge marks that get their own arrowhead color. */
const ARROW_KINDS: Array<MarkKind | 'none'> = ['none', 'path', 'compare', 'swap', 'delete', 'notfound'];

/**
 * Draws the graph in a 100 x 100 viewBox. Directed edges get arrowheads; edges in both directions are
 * bent apart so both stay visible. Weights sit on a small backing pill for legibility.
 * @param props - graph state and marks
 */
export function GraphView({ state, marks }: GraphViewProps) {
  const byIndex = marksByIndex(marks);
  const { nodes, edges, directed, weighted, edgeMarks } = state;
  const has = new Set(edges.map((e) => `${e.from}>${e.to}`));
  return (
    <div className="graph-view">
      <svg viewBox="0 0 100 100" role="img" aria-label={`Graph with ${nodes.length} nodes and ${edges.length} edges`}>
        <defs>
          {ARROW_KINDS.map((k) => (
            <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="edge-arrow" data-mark={k} />
            </marker>
          ))}
        </defs>
        {edges.map((e, i) => {
          const a = nodes[e.from];
          const b = nodes[e.to];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const bend = directed && has.has(`${e.to}>${e.from}`) ? 7 : 0;
          const nx = -uy * bend;
          const ny = ux * bend;
          const x1 = a.x + ux * R;
          const y1 = a.y + uy * R;
          const x2 = b.x - ux * (R + (directed ? 0.6 : 0));
          const y2 = b.y - uy * (R + (directed ? 0.6 : 0));
          const mx = (x1 + x2) / 2 + nx;
          const my = (y1 + y2) / 2 + ny;
          const kind = edgeMarks[edgeKey(e.from, e.to, directed)] ?? 'none';
          return (
            <g key={i} className="edge" data-mark={kind}>
              <path d={bend ? `M${x1} ${y1} Q${mx + nx} ${my + ny} ${x2} ${y2}` : `M${x1} ${y1} L${x2} ${y2}`} markerEnd={directed ? `url(#arrow-${ARROW_KINDS.includes(kind) ? kind : 'none'})` : undefined} />
              {weighted && e.w !== undefined && (
                <g transform={`translate(${mx + (bend ? nx * 0.5 : 0)} ${my + (bend ? ny * 0.5 : 0)})`}>
                  <rect x={-3.6} y={-2.6} width={7.2} height={5.2} rx={2.6} className="edge-w-bg" />
                  <text className="edge-w" textAnchor="middle" dominantBaseline="central">{e.w}</text>
                </g>
              )}
            </g>
          );
        })}
        {nodes.map((n, i) => {
          const m = byIndex.get(i);
          return (
            <g key={i} className="node" data-mark={m?.top ?? 'none'} transform={`translate(${n.x} ${n.y})`}>
              <circle r={R} />
              <text className="node-label" textAnchor="middle" dominantBaseline="central">{n.label}</text>
              {n.sub && <text className="node-sub" textAnchor="middle" y={R + 3.6}>{n.sub}</text>}
              {m?.labels.length ? <text className="node-tag" textAnchor="middle" y={-R - 1.6}>{m.labels.join(' ')}</text> : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
