import { InputError } from '../../core/forms';
import type { Cell, Mark, TableState } from '../../core/step';
import { Rec } from '../../core/tracer';
import { edgeKey } from '../../core/step';
import { defineGraph, graphInput, GraphRec, L, parseGraph } from './util';

/** Display for an unreachable distance. */
const INF = '∞';

/** Dijkstra's shortest paths on an undirected weighted graph with non-negative weights. */
export const dijkstraGraph = defineGraph({
  id: 'dijkstra-graph',
  name: "Dijkstra's Shortest Paths",
  group: 'Shortest paths',
  summary: 'Repeatedly finalizes the closest unvisited node and relaxes its edges to improve neighbors.',
  complexity: { best: 'O(V²)', average: 'O(V²)', worst: 'O(V²)', space: 'O(V)' },
  pseudocode: [
    'dist[start] = 0; every other dist = infinity',
    'while an unvisited node remains',
    '  u = unvisited node with the smallest dist',
    '  mark u visited',
    '  for each edge (u, v, w)',
    '    if dist[u] + w < dist[v]: dist[v] = dist[u] + w',
  ],
  input: graphInput({ n: 7, edges: 'A-B:4, A-C:2, B-C:1, B-D:5, C-D:8, C-E:10, D-E:2, D-F:6, E-F:3, F-G:1, E-G:9', weighted: true }),
  run(input) {
    const g = parseGraph(input, false, true);
    if (g.edges.some((e) => e.w < 0)) throw new InputError("Dijkstra's algorithm needs non-negative weights. Try Bellman-Ford for negative weights.");
    const r = new GraphRec(g, ['nodes finalized', 'relaxations']);
    const dist = Array(g.n).fill(Infinity);
    const done = Array(g.n).fill(false);
    const parent: number[] = Array(g.n).fill(-1);
    dist[g.source] = 0;
    r.alloc(3 * g.n);
    const show = () => dist.forEach((d, i) => (r.sub[i] = d === Infinity ? INF : String(d)));
    show();
    r.kinds[g.source] = 'frontier';
    r.snap(0, `Distance to ${L(g.source)} is 0. Every other node starts at infinity.`);
    for (;;) {
      let u = -1;
      for (let i = 0; i < g.n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0) break;
      done[u] = true;
      r.kinds[u] = 'active';
      r.count('nodes finalized');
      r.snap(2, `${L(u)} has the smallest distance (${dist[u]}) among unvisited nodes: finalize it.`);
      for (const { to: v, w, edge } of g.adj[u]) {
        if (done[v]) continue;
        const cand = dist[u] + w;
        if (cand < dist[v]) {
          if (parent[v] >= 0) r.edge(parent[v], v, null);
          dist[v] = cand;
          parent[v] = u;
          r.edge(u, v, 'path');
          r.kinds[v] = 'frontier';
          r.count('relaxations');
          show();
          r.snap(5, `Going through ${L(u)} reaches ${L(v)} in ${cand} (edge weight ${g.edges[edge].w}): shorter, so update.`);
        } else r.flash(u, v, 'compare', 5, `Going through ${L(u)} reaches ${L(v)} in ${cand}, no better than ${dist[v]}.`);
      }
      r.kinds[u] = 'visited';
      r.snap(1, `${L(u)} is final.`);
    }
    r.snap(1, 'Done: every reachable node has its shortest distance.');
    return r.steps;
  },
});

/** Bellman-Ford on a directed weighted graph; handles negative weights and detects negative cycles. */
export const bellmanFord = defineGraph({
  id: 'bellman-ford',
  name: 'Bellman-Ford',
  group: 'Shortest paths',
  summary: 'Relaxes every edge V-1 times. Works with negative weights and can detect negative cycles.',
  complexity: { best: 'O(E)', average: 'O(V·E)', worst: 'O(V·E)', space: 'O(V)' },
  pseudocode: [
    'dist[start] = 0; others = infinity',
    'repeat V-1 times',
    '  for each edge (u, v, w)',
    '    if dist[u] + w < dist[v]: dist[v] = dist[u] + w',
    'for each edge (u, v, w)',
    '  if dist[u] + w < dist[v]: negative cycle',
  ],
  input: graphInput({ n: 5, edges: 'A-B:4, A-C:5, B-C:-3, C-D:4, B-D:6, D-E:2', weighted: true, directed: true, negative: true }),
  run(input) {
    const g = parseGraph(input, true, true);
    const r = new GraphRec(g, ['rounds', 'relaxations']);
    const dist = Array(g.n).fill(Infinity);
    const parent: number[] = Array(g.n).fill(-1);
    dist[g.source] = 0;
    r.alloc(2 * g.n);
    const show = () => dist.forEach((d, i) => (r.sub[i] = d === Infinity ? INF : String(d)));
    show();
    r.snap(0, `Distance to ${L(g.source)} is 0; the rest are infinity.`);
    for (let round = 1; round < g.n; round++) {
      let changed = false;
      r.count('rounds');
      for (const e of g.edges) {
        if (dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]) {
          dist[e.v] = dist[e.u] + e.w;
          parent[e.v] = e.u;
          changed = true;
          r.count('relaxations');
          show();
          r.kinds[e.v] = 'frontier';
          r.flash(e.u, e.v, 'swap', 3, `Round ${round}: ${L(e.u)}→${L(e.v)} improves ${L(e.v)} to ${dist[e.v]}.`);
        } else r.flash(e.u, e.v, 'compare', 3, `Round ${round}: ${L(e.u)}→${L(e.v)} does not improve ${L(e.v)}.`);
      }
      if (!changed) {
        r.snap(1, `Round ${round} changed nothing: the distances are final. Stop early.`);
        break;
      }
    }
    for (const e of g.edges) {
      if (dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]) {
        r.edge(e.u, e.v, 'delete');
        r.snap(5, `${L(e.u)}→${L(e.v)} still improves after V-1 rounds: there is a negative cycle, so no shortest path exists.`);
        return r.steps;
      }
    }
    dist.forEach((_, v) => parent[v] >= 0 && r.edge(parent[v], v, 'path'));
    r.snap(4, 'No edge can be improved: there is no negative cycle. The shortest-path tree is highlighted.');
    return r.steps;
  },
});

/** Floyd-Warshall all-pairs shortest paths, drawn as a distance matrix. */
export const floydWarshall = defineGraph({
  id: 'floyd-warshall',
  name: 'Floyd-Warshall',
  group: 'Shortest paths',
  summary: 'Tries every node k as an intermediate stop and improves every pair (i, j) that gets shorter through k.',
  complexity: { best: 'O(V³)', average: 'O(V³)', worst: 'O(V³)', space: 'O(V²)' },
  pseudocode: [
    'dist[i][j] = edge weight, 0 on the diagonal, infinity otherwise',
    'for each intermediate node k',
    '  for each pair (i, j)',
    '    if dist[i][k] + dist[k][j] < dist[i][j]',
    '      dist[i][j] = dist[i][k] + dist[k][j]',
  ],
  view: 'cells',
  input: graphInput({ n: 4, edges: 'A-B:3, A-D:7, B-C:2, C-A:5, C-D:1, D-A:2', weighted: true, directed: true, noSource: true }),
  run(input) {
    const g = parseGraph({ ...input, source: 0 }, true, true);
    const n = g.n;
    const d: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
    for (const e of g.edges) d[e.u][e.v] = Math.min(d[e.u][e.v], e.w);
    const r = new Rec<TableState>(['checks', 'improvements']);
    r.alloc(n * n);
    /** Snapshot of the matrix with the given highlights. */
    const snap = (marks: Mark[], line: number, explain: string) =>
      r.snap(
        { rows: n, cols: n, cells: d.flat().map((v): Cell => (v === Infinity ? INF : v)), rowLabels: Array.from({ length: n }, (_, i) => L(i)), colLabels: Array.from({ length: n }, (_, i) => L(i)), caption: 'Shortest known distance from row to column' },
        marks,
        line,
        explain,
      );
    snap([], 0, 'Start with direct edge weights only.');
    for (let k = 0; k < n; k++) {
      snap([...Array.from({ length: n }, (_, i) => ({ kind: 'range' as const, index: k * n + i })), ...Array.from({ length: n }, (_, i) => ({ kind: 'range' as const, index: i * n + k }))], 1, `Allow ${L(k)} as an intermediate stop.`);
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          if (i === k || j === k || i === j || d[i][k] === Infinity || d[k][j] === Infinity) continue;
          r.count('checks');
          const via = d[i][k] + d[k][j];
          const marks: Mark[] = [{ kind: 'active', index: i * n + k }, { kind: 'active', index: k * n + j }];
          if (via < d[i][j]) {
            const old = d[i][j];
            d[i][j] = via;
            r.count('improvements');
            snap([...marks, { kind: 'swap', index: i * n + j }], 4, `${L(i)}→${L(k)}→${L(j)} costs ${via}, better than ${old === Infinity ? INF : old}: update.`);
          } else snap([...marks, { kind: 'compare', index: i * n + j }], 3, `${L(i)}→${L(k)}→${L(j)} costs ${via}, no better than ${d[i][j]}.`);
        }
    }
    snap([], 1, 'Done: the matrix holds the shortest distance between every pair.');
    return r.steps;
  },
});

// edgeKey is re-exported for tests that inspect edge marks.
export { edgeKey };
