import { GRAPHS } from '../../src/algorithms/graph';
import { parseGraph, type Graph } from '../../src/algorithms/graph/util';
import { buildForm, defaultRaw } from '../../src/core/forms';
import type { GraphState, Step, TableState } from '../../src/core/step';

const byId = (id: string) => GRAPHS.find((d) => d.id === id)!;

/** Builds a typed input from defaults, optionally overridden by a random seed. */
function makeInput(id: string, seed?: number) {
  const def = byId(id);
  const raw = { ...defaultRaw(def), ...(seed !== undefined ? def.input.randomize!(seed) : {}) };
  const built = buildForm(def.input.form!, raw);
  if (!built.ok) throw new Error(built.error);
  return built.input;
}

/** Reads the final sub-caption of every node. */
const finalSubs = (steps: Step<any>[]): string[] => (steps.at(-1)!.state as GraphState).nodes.map((n) => n.sub ?? '');
const last = (steps: Step<any>[]) => steps.at(-1)!;

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

/** Reference single-source shortest distances by Bellman-Ford (Infinity when unreachable). */
function refDist(g: Graph): number[] {
  const d = Array(g.n).fill(Infinity);
  d[g.source] = 0;
  for (let i = 0; i < g.n; i++)
    for (const e of g.edges) {
      if (d[e.u] + e.w < d[e.v]) d[e.v] = d[e.u] + e.w;
      if (!g.directed && d[e.v] + e.w < d[e.u]) d[e.u] = d[e.v] + e.w;
    }
  return d;
}

describe('BFS', () => {
  it.each(SEEDS)('matches reference distances (seed %i)', (seed) => {
    const input = makeInput('graph-bfs', seed);
    const g = parseGraph(input, false, false);
    const ref = refDist(g);
    const subs = finalSubs(byId('graph-bfs').run(input));
    ref.forEach((d, i) => expect(subs[i]).toBe(d === Infinity ? '' : `d=${d}`));
  });
});

describe('DFS', () => {
  it('visits exactly the nodes reachable from the start', () => {
    const input = makeInput('graph-dfs');
    const g = parseGraph(input, false, false);
    const ref = refDist(g);
    const subs = finalSubs(byId('graph-dfs').run(input));
    ref.forEach((d, i) => expect(subs[i] !== '').toBe(d !== Infinity));
  });
});

describe('connected components', () => {
  it('finds 3 components in the default graph', () => {
    const steps = byId('connected-components').run(makeInput('connected-components'));
    expect(last(steps).stats.components).toBe(3);
  });
});

describe("Dijkstra's", () => {
  it.each(SEEDS)('matches reference distances (seed %i)', (seed) => {
    const input = makeInput('dijkstra-graph', seed);
    const ref = refDist(parseGraph(input, false, true));
    const subs = finalSubs(byId('dijkstra-graph').run(input));
    ref.forEach((d, i) => expect(subs[i]).toBe(d === Infinity ? '∞' : String(d)));
  });
  it('rejects negative weights with a helpful error', () => {
    const def = byId('dijkstra-graph');
    const raw = { ...defaultRaw(def), edges: 'A-B:-2' };
    const built = buildForm(def.input.form!, raw);
    expect(() => def.run((built as any).input)).toThrow(/non-negative/);
  });
});

describe('Bellman-Ford', () => {
  it('matches reference distances on the default graph', () => {
    const input = makeInput('bellman-ford');
    const ref = refDist(parseGraph(input, true, true));
    const subs = finalSubs(byId('bellman-ford').run(input));
    ref.forEach((d, i) => expect(subs[i]).toBe(d === Infinity ? '∞' : String(d)));
  });
  it('detects a negative cycle', () => {
    const def = byId('bellman-ford');
    const built = buildForm(def.input.form!, { ...defaultRaw(def), n: '3', edges: 'A-B:1, B-C:-3, C-A:1' });
    const steps = def.run((built as any).input);
    expect(last(steps).explain).toContain('negative cycle');
  });
});

describe('Floyd-Warshall', () => {
  it('agrees with Bellman-Ford from every source', () => {
    const input = makeInput('floyd-warshall');
    const g = parseGraph({ ...input, source: 0 }, true, true);
    const table = last(byId('floyd-warshall').run(input)).state as TableState;
    for (let s = 0; s < g.n; s++) {
      const ref = refDist({ ...g, source: s });
      ref.forEach((d, j) => expect(table.cells[s * g.n + j]).toBe(d === Infinity ? '∞' : d));
    }
  });
});

describe('minimum spanning trees', () => {
  it('Prim and Kruskal agree on total weight', () => {
    const prim = last(byId('prim').run(makeInput('prim'))).stats['total weight'];
    const kruskal = last(byId('kruskal').run(makeInput('kruskal'))).stats['total weight'];
    expect(prim).toBe(kruskal);
    expect(prim).toBe(39);
  });
  it.each(SEEDS)('agree on random graphs (seed %i)', (seed) => {
    const a = last(byId('prim').run(makeInput('prim', seed))).stats['total weight'];
    const b = last(byId('kruskal').run(makeInput('kruskal', seed))).stats['total weight'];
    expect(a).toBe(b);
  });
});

describe('topological sort', () => {
  for (const id of ['topological-sort-kahn', 'topological-sort-dfs']) {
    it.each(SEEDS)(`${id} orders every edge forward (seed %i)`, (seed) => {
      const def = byId(id);
      const raw = { ...defaultRaw(def), ...def.input.randomize!(seed) };
      const input = (buildForm(def.input.form!, raw) as any).input;
      const g = parseGraph({ ...input, source: 0 }, true, false);
      const subs = finalSubs(def.run(input));
      const pos = subs.map((s) => Number(s.replace('#', '')));
      expect(pos.every((p) => Number.isInteger(p))).toBe(true);
      g.edges.forEach((e) => expect(pos[e.u]).toBeLessThan(pos[e.v]));
    });
  }
  it('Kahn reports a cycle instead of an order', () => {
    const def = byId('topological-sort-kahn');
    const built = buildForm(def.input.form!, { ...defaultRaw(def), n: '3', edges: 'A-B, B-C, C-A' });
    expect(last(def.run((built as any).input)).explain).toContain('cycle');
  });
});

/** Reference: is there a directed cycle? (DFS with colors.) */
function hasCycle(g: Graph): boolean {
  const color = Array(g.n).fill(0);
  const dfs = (u: number): boolean => {
    color[u] = 1;
    for (const { to } of g.adj[u]) if (color[to] === 1 || (color[to] === 0 && dfs(to))) return true;
    color[u] = 2;
    return false;
  };
  return g.adj.some((_, s) => color[s] === 0 && dfs(s));
}

describe('cycle detection', () => {
  it.each(SEEDS)('matches the reference (seed %i)', (seed) => {
    const def = byId('cycle-detection');
    const raw = { ...defaultRaw(def), ...def.input.randomize!(seed) };
    const input = (buildForm(def.input.form!, raw) as any).input;
    const g = parseGraph({ ...input, source: 0 }, true, false);
    expect(last(def.run(input)).stats['cycle found'] === 1).toBe(hasCycle(g));
  });
  it('finds the cycle in the default graph', () => {
    expect(last(byId('cycle-detection').run(makeInput('cycle-detection'))).stats['cycle found']).toBe(1);
  });
});

/** Reference SCC labeling by mutual reachability. */
function refScc(g: Graph): number[] {
  const reach = Array.from({ length: g.n }, (_, i) => {
    const seen = new Set([i]);
    const stack = [i];
    while (stack.length) for (const { to } of g.adj[stack.pop()!]) if (!seen.has(to)) (seen.add(to), stack.push(to));
    return seen;
  });
  // Label each node with the smallest node index it is mutually reachable with.
  const comp = Array.from({ length: g.n }, (_, i) => Array.from({ length: g.n }, (_, j) => j).find((j) => reach[i].has(j) && reach[j].has(i)) as number);
  return comp;
}

describe("Tarjan's SCC", () => {
  it('finds 3 components in the default graph', () => {
    expect(last(byId('tarjan-scc').run(makeInput('tarjan-scc'))).stats.components).toBe(3);
  });
  it.each(SEEDS)('partitions like the reference (seed %i)', (seed) => {
    const def = byId('tarjan-scc');
    const raw = { ...defaultRaw(def), ...def.input.randomize!(seed) };
    const input = (buildForm(def.input.form!, raw) as any).input;
    const g = parseGraph({ ...input, source: 0 }, true, false);
    const subs = finalSubs(def.run(input));
    const ref = refScc(g);
    for (let i = 0; i < g.n; i++) for (let j = 0; j < g.n; j++) expect(subs[i] === subs[j]).toBe(ref[i] === ref[j]);
  });
});

describe('input errors', () => {
  it('explains a malformed edge', () => {
    const def = byId('graph-bfs');
    const built = buildForm(def.input.form!, { ...defaultRaw(def), edges: 'A~B' });
    expect(() => def.run((built as any).input)).toThrow(/not an edge/);
  });
  it('rejects an out-of-range node', () => {
    const def = byId('graph-bfs');
    const built = buildForm(def.input.form!, { ...defaultRaw(def), n: '3', edges: 'A-Z' });
    expect(() => def.run((built as any).input)).toThrow(/outside/);
  });
});
