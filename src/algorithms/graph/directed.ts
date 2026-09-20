import { defineGraph, graphInput, GraphRec, L, parseGraph } from './util';

/** Default DAG for topological sorting. */
const DAG = { n: 6, edges: 'A-B, A-C, B-D, C-D, D-E, C-F, F-E', directed: true, acyclic: true, noSource: true } as const;

/** Kahn's topological sort: repeatedly remove nodes with no incoming edges. */
export const topoKahn = defineGraph({
  id: 'topological-sort-kahn',
  name: "Topological Sort (Kahn's)",
  group: 'Directed graphs',
  summary: 'Repeatedly outputs a node with no remaining incoming edges, then removes its outgoing edges.',
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  pseudocode: [
    'compute the in-degree of every node',
    'queue = all nodes with in-degree 0',
    'while queue is not empty',
    '  u = dequeue(); append u to the order',
    '  for each edge u→v: in-degree[v]--; if it hits 0, enqueue v',
  ],
  input: graphInput(DAG),
  run(input) {
    const g = parseGraph({ ...input, source: 0 }, true, false);
    const r = new GraphRec(g, ['sorted']);
    const indeg = Array(g.n).fill(0);
    r.alloc(g.n);
    g.edges.forEach((e) => indeg[e.v]++);
    const show = () => indeg.forEach((d, i) => r.sub[i] === '' || r.sub[i].startsWith('in=') ? (r.sub[i] = `in=${d}`) : 0);
    show();
    const q: number[] = [];
    indeg.forEach((d, i) => d === 0 && (q.push(i), r.alloc(1), (r.kinds[i] = 'frontier')));
    r.snap(1, `Nodes with no incoming edges: ${q.length ? q.map(L).join(', ') : 'none'}.`);
    let k = 0;
    while (q.length) {
      const u = q.shift() as number;
      r.free(1);
      r.kinds[u] = 'active';
      r.sub[u] = `#${++k}`;
      r.count('sorted');
      r.snap(3, `Output ${L(u)} as number ${k}.`);
      for (const { to: v } of g.adj[u]) {
        indeg[v]--;
        show();
        if (indeg[v] === 0) {
          q.push(v);
          r.alloc(1);
          r.kinds[v] = 'frontier';
          r.flash(u, v, 'path', 4, `Remove ${L(u)}→${L(v)}: ${L(v)} now has no incoming edges, so queue it.`);
        } else r.flash(u, v, 'compare', 4, `Remove ${L(u)}→${L(v)}: ${L(v)} still has ${indeg[v]} incoming.`);
      }
      r.kinds[u] = 'visited';
    }
    r.snap(2, k === g.n ? 'Done: every node was output, so this order is a valid topological sort.' : `Stuck: ${g.n - k} node(s) still have incoming edges. The graph has a cycle, so no topological order exists.`);
    return r.steps;
  },
});

/** DFS-based topological sort: order by reverse finish time. */
export const topoDfs = defineGraph({
  id: 'topological-sort-dfs',
  name: 'Topological Sort (DFS)',
  group: 'Directed graphs',
  summary: 'Runs a depth-first search and lists nodes in reverse order of finishing.',
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  pseudocode: [
    'for each unvisited node u: dfs(u)',
    'dfs(u): mark u in progress',
    '  for each edge u→v: dfs(v) if v is unvisited',
    '  mark u done; push u onto the order',
    'reverse the order',
  ],
  input: graphInput(DAG),
  run(input) {
    const g = parseGraph({ ...input, source: 0 }, true, false);
    const r = new GraphRec(g, ['finished']);
    const state = Array(g.n).fill(0); // 0 new, 1 in progress, 2 done
    r.alloc(2 * g.n);
    const order: number[] = [];
    let cyc = false;
    /** Depth-first visit; stops the whole search when a back edge proves a cycle. */
    const dfs = (u: number): void => {
      if (cyc) return;
      r.enter();
      state[u] = 1;
      r.kinds[u] = 'active';
      r.snap(1, `Enter ${L(u)}.`);
      for (const { to: v } of g.adj[u]) {
        if (cyc) return;
        if (state[v] === 1) {
          cyc = true;
          r.edge(u, v, 'delete');
          r.snap(2, `${L(u)}→${L(v)} points back into the current path: there is a cycle, so no topological order exists.`);
          return;
        }
        if (state[v] === 0) {
          r.edge(u, v, 'path');
          r.snap(2, `${L(v)} is unvisited: go deeper.`);
          dfs(v);
          r.kinds[u] = 'active';
        }
      }
      if (cyc) return;
      r.leave();
      state[u] = 2;
      order.push(u);
      r.kinds[u] = 'visited';
      r.count('finished');
      r.sub[u] = `f${order.length}`;
      r.snap(3, `${L(u)} is finished (finish number ${order.length}).`);
    };
    r.snap(0, 'Start searching from each unvisited node in turn.');
    for (let s = 0; s < g.n && !cyc; s++) if (state[s] === 0) dfs(s);
    if (!cyc) {
      order.reverse().forEach((u, i) => (r.sub[u] = `#${i + 1}`));
      r.snap(4, `Reverse the finish order: ${order.map(L).join(' → ')}.`);
    }
    return r.steps;
  },
});

/** Cycle detection in a directed graph with three-color DFS. */
export const cycleDetection = defineGraph({
  id: 'cycle-detection',
  name: 'Cycle Detection (Directed)',
  group: 'Directed graphs',
  summary: 'Depth-first search that flags an edge pointing back to a node still on the current path.',
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  pseudocode: [
    'color every node white',
    'dfs(u): color u gray (on the current path)',
    '  for each edge u→v',
    '    if v is gray: cycle found',
    '    if v is white: dfs(v)',
    '  color u black (finished)',
  ],
  input: graphInput({ n: 5, edges: 'A-B, B-C, C-D, D-B, A-E', directed: true, noSource: true }),
  run(input) {
    const g = parseGraph({ ...input, source: 0 }, true, false);
    const r = new GraphRec(g, ['cycle found', 'nodes visited']);
    const color = Array(g.n).fill(0);
    r.alloc(g.n);
    const path: number[] = [];
    let found = false;
    /** Visits u; returns true as soon as a cycle is found. */
    const dfs = (u: number): boolean => {
      r.enter();
      color[u] = 1;
      path.push(u);
      r.kinds[u] = 'active';
      r.count('nodes visited');
      r.snap(1, `Enter ${L(u)}: it is now on the current path (gray).`);
      for (const { to: v } of g.adj[u]) {
        if (color[v] === 1) {
          const cycle = path.slice(path.indexOf(v));
          cycle.forEach((c, i) => {
            r.kinds[c] = 'delete';
            r.edge(c, cycle[(i + 1) % cycle.length], 'delete');
          });
          r.raise('cycle found', 1);
          r.snap(3, `${L(u)}→${L(v)} leads back to ${L(v)}, which is on the path: cycle ${cycle.map(L).join(' → ')} → ${L(v)}.`);
          return true;
        }
        if (color[v] === 0) {
          r.edge(u, v, 'path');
          r.snap(4, `${L(v)} is new: go deeper.`);
          if (dfs(v)) return true;
          r.kinds[u] = 'active';
        } else r.flash(u, v, 'compare', 2, `${L(v)} is already finished: this edge cannot start a cycle.`);
      }
      r.leave();
      color[u] = 2;
      path.pop();
      r.kinds[u] = 'visited';
      r.snap(5, `${L(u)} is finished (black).`);
      return false;
    };
    r.snap(0, 'All nodes start white (unvisited).');
    for (let s = 0; s < g.n && !found; s++) if (color[s] === 0) found = dfs(s);
    if (!found) r.snap(5, 'Done: no edge points back into the current path, so the graph has no cycle.');
    return r.steps;
  },
});

/** Tarjan's strongly connected components. */
export const tarjanScc = defineGraph({
  id: 'tarjan-scc',
  name: "Tarjan's Strongly Connected Components",
  group: 'Directed graphs',
  summary: 'One DFS tracks discovery index and low-link; a node whose low-link equals its index roots a component.',
  complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  pseudocode: [
    'dfs(u): index[u] = low[u] = next index; push u',
    '  for each edge u→v',
    '    if v is new: dfs(v); low[u] = min(low[u], low[v])',
    '    elif v is on the stack: low[u] = min(low[u], index[v])',
    '  if low[u] == index[u]: pop the stack down to u as one component',
  ],
  input: graphInput({ n: 8, edges: 'A-B, B-C, C-A, B-D, D-E, E-F, F-D, G-F, G-H, H-G', directed: true, noSource: true }),
  run(input) {
    const g = parseGraph({ ...input, source: 0 }, true, false);
    const r = new GraphRec(g, ['components']);
    const idx = Array(g.n).fill(-1);
    const low = Array(g.n).fill(0);
    const onStack = Array(g.n).fill(false);
    const stack: number[] = [];
    r.alloc(3 * g.n);
    let next = 0;
    let comps = 0;
    const show = (u: number) => (r.sub[u] = `${idx[u]}/${low[u]}`);
    /** Tarjan's recursive visit. */
    const dfs = (u: number): void => {
      r.enter();
      idx[u] = low[u] = next++;
      stack.push(u);
      onStack[u] = true;
      r.kinds[u] = 'active';
      show(u);
      r.snap(0, `Enter ${L(u)}: index ${idx[u]}. Push it on the stack.`);
      for (const { to: v } of g.adj[u]) {
        if (idx[v] < 0) {
          r.edge(u, v, 'path');
          r.snap(2, `${L(v)} is new: visit it.`);
          dfs(v);
          low[u] = Math.min(low[u], low[v]);
          r.kinds[u] = 'active';
          show(u);
          r.snap(2, `Back at ${L(u)}: low-link becomes ${low[u]}.`);
        } else if (onStack[v]) {
          low[u] = Math.min(low[u], idx[v]);
          show(u);
          r.flash(u, v, 'compare', 3, `${L(v)} is on the stack: low-link of ${L(u)} becomes ${low[u]}.`);
        } else r.flash(u, v, 'notfound', 3, `${L(v)} already belongs to a finished component: ignore.`);
      }
      if (low[u] === idx[u]) {
        comps++;
        r.raise('components', comps);
        const members: number[] = [];
        let w: number;
        do {
          w = stack.pop() as number;
          onStack[w] = false;
          members.push(w);
          r.kinds[w] = 'sorted';
          r.sub[w] = `S${comps}`;
        } while (w !== u);
        r.snap(4, `${L(u)} is a root (low-link equals index): {${members.map(L).reverse().join(', ')}} is strongly connected component ${comps}.`);
      } else {
        r.kinds[u] = 'frontier';
        r.snap(4, `${L(u)} is not a root; it stays on the stack.`);
      }
      r.leave();
    };
    r.snap(0, 'No node has been visited yet.');
    for (let s = 0; s < g.n; s++) if (idx[s] < 0) dfs(s);
    r.snap(4, `Done: ${comps} strongly connected component${comps === 1 ? '' : 's'}.`);
    return r.steps;
  },
});
