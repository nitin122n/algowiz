import { defineGraph, graphInput, GraphRec, L, parseGraph } from './util';
import { edgeKey } from '../../core/step';

/** Default weighted undirected graph for spanning trees. */
const WEIGHTED = graphInput({ n: 7, edges: 'A-B:7, A-D:5, B-C:8, B-D:9, B-E:7, C-E:5, D-E:15, D-F:6, E-F:8, E-G:9, F-G:11', weighted: true });

/** Prim's minimum spanning tree. */
export const prim = defineGraph({
  id: 'prim',
  name: "Prim's Minimum Spanning Tree",
  group: 'Spanning trees',
  summary: 'Grows one tree from the start node, always adding the cheapest edge that reaches a new node.',
  complexity: { best: 'O(V²)', average: 'O(V²)', worst: 'O(V²)', space: 'O(V)' },
  pseudocode: [
    'tree = {start}',
    'while the tree does not cover every node',
    '  look at all edges from the tree to outside nodes',
    '  pick the cheapest one',
    '  add its outside node to the tree',
  ],
  input: WEIGHTED,
  run(input) {
    const g = parseGraph(input, false, true);
    const r = new GraphRec(g, ['total weight', 'edges added']);
    const inTree = Array(g.n).fill(false);
    inTree[g.source] = true;
    r.alloc(g.n);
    r.kinds[g.source] = 'visited';
    let total = 0;
    r.snap(0, `Start the tree at ${L(g.source)}.`);
    for (;;) {
      const cand = g.edges.map((e, i) => ({ e, i })).filter(({ e }) => inTree[e.u] !== inTree[e.v]);
      if (!cand.length) break;
      const prev = { ...r.edgeMarks };
      cand.forEach(({ e }) => r.edge(e.u, e.v, 'compare'));
      r.snap(2, `Edges leaving the tree: ${cand.map(({ e }) => `${L(e.u)}-${L(e.v)}(${e.w})`).join(', ')}.`);
      r.edgeMarks = prev;
      const best = cand.reduce((a, b) => (b.e.w < a.e.w ? b : a));
      const out = inTree[best.e.u] ? best.e.v : best.e.u;
      inTree[out] = true;
      total += best.e.w;
      r.raise('total weight', total);
      r.count('edges added');
      r.edge(best.e.u, best.e.v, 'path');
      r.kinds[out] = 'visited';
      r.snap(3, `Cheapest is ${L(best.e.u)}-${L(best.e.v)} (weight ${best.e.w}): add ${L(out)}. Total weight ${total}.`);
    }
    r.snap(1, inTree.every(Boolean) ? `Done: the spanning tree has total weight ${total}.` : `The graph is disconnected: the tree covers only the start node's component (weight ${total}).`);
    return r.steps;
  },
});

/** Kruskal's minimum spanning tree with union-find. */
export const kruskal = defineGraph({
  id: 'kruskal',
  name: "Kruskal's Minimum Spanning Tree",
  group: 'Spanning trees',
  summary: 'Considers edges from cheapest to costliest and keeps each one that does not close a cycle.',
  complexity: { best: 'O(E log E)', average: 'O(E log E)', worst: 'O(E log E)', space: 'O(V)' },
  pseudocode: [
    'sort edges by weight',
    'each node starts in its own set',
    'for each edge (u, v) in order',
    '  if find(u) != find(v)',
    '    keep the edge; union(u, v)',
    '  else: skip it (it would close a cycle)',
  ],
  input: graphInput({ n: 7, edges: 'A-B:7, A-D:5, B-C:8, B-D:9, B-E:7, C-E:5, D-E:15, D-F:6, E-F:8, E-G:9, F-G:11', weighted: true, noSource: true }),
  run(input) {
    const g = parseGraph({ ...input, source: 0 }, false, true);
    const r = new GraphRec(g, ['total weight', 'edges added']);
    const root = Array.from({ length: g.n }, (_, i) => i);
    r.alloc(g.n + g.edges.length);
    /** Finds the set representative of x. */
    const find = (x: number): number => (root[x] === x ? x : (root[x] = find(root[x])));
    const label = () => root.forEach((_, i) => (r.sub[i] = `set ${L(find(i))}`));
    label();
    r.snap(1, 'Every node starts in its own set.');
    const sorted = [...g.edges].sort((a, b) => a.w - b.w);
    r.snap(0, `Edges sorted by weight: ${sorted.map((e) => `${L(e.u)}-${L(e.v)}(${e.w})`).join(', ')}.`);
    let total = 0;
    let added = 0;
    for (const e of sorted) {
      const a = find(e.u);
      const b = find(e.v);
      if (a !== b) {
        root[a] = b;
        total += e.w;
        added++;
        r.raise('total weight', total);
        r.count('edges added');
        r.edge(e.u, e.v, 'path');
        label();
        r.snap(4, `${L(e.u)} and ${L(e.v)} are in different sets: keep ${L(e.u)}-${L(e.v)} (${e.w}) and merge. Total ${total}.`);
      } else {
        r.edgeMarks[edgeKey(e.u, e.v, false)] = 'notfound';
        r.snap(5, `${L(e.u)} and ${L(e.v)} are already connected: skip ${L(e.u)}-${L(e.v)} (${e.w}) to avoid a cycle.`);
      }
      if (added === g.n - 1) break;
    }
    r.snap(3, added === g.n - 1 ? `Done: the spanning tree has total weight ${total}.` : `The graph is disconnected: this is a spanning forest of weight ${total}.`);
    return r.steps;
  },
});
