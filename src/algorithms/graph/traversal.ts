import { defineGraph, graphInput, GraphRec, L, parseGraph } from './util';

/** Default undirected graph for traversals. */
const TRAVERSAL = graphInput({ n: 8, edges: 'A-B, A-C, B-D, B-E, C-F, E-G, F-G, D-H' });

/** Breadth-first search on an undirected graph, showing distance from the start node. */
export const graphBfs = defineGraph({
  id: 'graph-bfs',
  name: 'Breadth-First Search',
  group: 'Traversal',
  summary: 'Visits nodes level by level using a queue, so each node gets its fewest-edges distance from the start.',
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  pseudocode: [
    'queue = [start]; seen = {start}',
    'while queue is not empty',
    '  u = dequeue()',
    '  for each neighbor v of u',
    '    if v not seen: seen.add(v); dist[v] = dist[u] + 1; enqueue(v)',
  ],
  input: TRAVERSAL,
  run(input) {
    const g = parseGraph(input, false, false);
    const r = new GraphRec(g, ['visited', 'edges checked']);
    const s = g.source;
    const seen = Array(g.n).fill(false);
    const dist = Array(g.n).fill(0);
    const q = [s];
    r.alloc(2 * g.n + 1);
    seen[s] = true;
    r.kinds[s] = 'frontier';
    r.sub[s] = 'd=0';
    r.snap(0, `Start at ${L(s)}: put it in the queue.`);
    while (q.length) {
      const u = q.shift() as number;
      r.free(1);
      r.kinds[u] = 'active';
      r.snap(2, `Take ${L(u)} from the front of the queue.`);
      for (const { to: v } of g.adj[u]) {
        r.count('edges checked');
        if (!seen[v]) {
          seen[v] = true;
          dist[v] = dist[u] + 1;
          r.kinds[v] = 'frontier';
          r.sub[v] = `d=${dist[v]}`;
          r.edge(u, v, 'path');
          q.push(v);
          r.alloc(1);
          r.snap(4, `${L(v)} is new: its distance is ${dist[v]}. Add it to the queue.`);
        } else r.flash(u, v, 'compare', 4, `${L(v)} was already seen: skip it.`);
      }
      r.kinds[u] = 'visited';
      r.count('visited');
      r.snap(1, `${L(u)} is done. Queue: ${q.length ? q.map(L).join(', ') : 'empty'}.`);
    }
    r.snap(1, `Done: reached ${seen.filter(Boolean).length} of ${g.n} nodes.`);
    return r.steps;
  },
});

/** Depth-first search on an undirected graph, showing entry order. */
export const graphDfs = defineGraph({
  id: 'graph-dfs',
  name: 'Depth-First Search',
  group: 'Traversal',
  summary: 'Follows one path as deep as it goes, then backs up and tries the next branch.',
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  pseudocode: [
    'dfs(u): mark u visited',
    '  for each neighbor v of u',
    '    if v not visited: dfs(v)',
    'finish u',
  ],
  input: TRAVERSAL,
  run(input) {
    const g = parseGraph(input, false, false);
    const r = new GraphRec(g, ['visited', 'edges checked']);
    const seen = Array(g.n).fill(false);
    let time = 0;
    /** Visits u and everything reachable from it that is still unvisited. */
    const dfs = (u: number): void => {
      r.enter();
      seen[u] = true;
      r.kinds[u] = 'active';
      r.sub[u] = `#${++time}`;
      r.count('visited');
      r.snap(0, `Enter ${L(u)} (visit number ${time}).`);
      for (const { to: v } of g.adj[u]) {
        r.count('edges checked');
        if (!seen[v]) {
          r.edge(u, v, 'path');
          r.snap(2, `${L(v)} is new: go deeper.`);
          dfs(v);
          r.kinds[u] = 'active';
          r.snap(1, `Back at ${L(u)}: try its next neighbor.`);
        } else r.flash(u, v, 'compare', 2, `${L(v)} was already visited: skip it.`);
      }
      r.kinds[u] = 'visited';
      r.snap(3, `${L(u)} is finished.`);
      r.leave();
    };
    r.alloc(g.n);
    r.snap(0, `Start the search at ${L(g.source)}.`);
    dfs(g.source);
    r.snap(3, `Done: reached ${seen.filter(Boolean).length} of ${g.n} nodes.`);
    return r.steps;
  },
});

/** Connected components by repeated breadth-first search. */
export const connectedComponents = defineGraph({
  id: 'connected-components',
  name: 'Connected Components',
  group: 'Traversal',
  summary: 'Starts a search from every node not yet reached; each search discovers one whole component.',
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  pseudocode: [
    'comp = 0',
    'for each node s not yet assigned',
    '  comp++; search from s',
    '  give every reached node the label comp',
  ],
  input: graphInput({ n: 8, edges: 'A-B, B-C, D-E, F-G, G-H', noSource: true }),
  run(input) {
    const g = parseGraph({ ...input, source: 0 }, false, false);
    const r = new GraphRec(g, ['components', 'visited']);
    const comp = Array(g.n).fill(0);
    let c = 0;
    r.alloc(g.n);
    r.snap(0, 'No node has a component yet.');
    for (let s = 0; s < g.n; s++) {
      if (comp[s]) continue;
      c++;
      r.raise('components', c);
      comp[s] = c;
      const q = [s];
      r.alloc(1);
      r.kinds[s] = 'active';
      r.sub[s] = `C${c}`;
      r.snap(2, `${L(s)} is unassigned: it starts component ${c}.`);
      while (q.length) {
        const u = q.shift() as number;
        r.free(1);
        for (const { to: v } of g.adj[u]) {
          if (comp[v]) continue;
          comp[v] = c;
          q.push(v);
          r.alloc(1);
          r.kinds[v] = 'frontier';
          r.sub[v] = `C${c}`;
          r.edge(u, v, 'path');
          r.snap(3, `${L(v)} is connected to ${L(u)}: it joins component ${c}.`);
        }
        r.kinds[u] = 'visited';
        r.count('visited');
      }
      r.snap(3, `Component ${c} is complete.`);
    }
    r.snap(1, `Done: the graph has ${c} connected component${c === 1 ? '' : 's'}.`);
    return r.steps;
  },
});
