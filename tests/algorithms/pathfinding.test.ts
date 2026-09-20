import { PATHFINDING } from '../../src/algorithms/pathfinding';
import { neighbors, parseProblem, type Problem } from '../../src/algorithms/pathfinding/util';
import { buildForm, defaultRaw } from '../../src/core/forms';
import type { GridState, Step } from '../../src/core/step';

const byId = (id: string) => PATHFINDING.find((d) => d.id === id)!;

/** Typed input for an algorithm from defaults, optionally seeded with random obstacles. */
function makeInput(id: string, seed?: number, override: Record<string, string> = {}) {
  const def = byId(id);
  const raw = { ...defaultRaw(def), ...(seed !== undefined ? def.input.randomize!(seed) : {}), ...override };
  const built = buildForm(def.input.form!, raw);
  if (!built.ok) throw new Error(built.error);
  return built.input;
}

/** Reference cheapest cost (Dijkstra with a linear scan), Infinity when unreachable. */
function refCost(p: Problem): number {
  const d = Array(p.rows * p.cols).fill(Infinity);
  const done = new Set<number>();
  d[p.start] = 0;
  for (;;) {
    let u = -1;
    d.forEach((v, i) => !done.has(i) && v < Infinity && (u < 0 || v < d[u]) && (u = i));
    if (u < 0) break;
    done.add(u);
    for (const n of neighbors(p, u)) d[n] = Math.min(d[n], d[u] + p.cost[n]);
  }
  return d[p.goal];
}

const last = (s: Step<GridState>[]) => s.at(-1)!;
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe('unweighted searches', () => {
  it.each(SEEDS)('BFS and bidirectional BFS find shortest paths (seed %i)', (seed) => {
    for (const id of ['grid-bfs', 'grid-bidirectional']) {
      const input = makeInput(id, seed);
      const expected = refCost({ ...parseProblem(input), cost: Array(parseProblem(input).rows * parseProblem(input).cols).fill(1) });
      const steps = byId(id).run(input);
      if (expected === Infinity) expect(last(steps).explain).toContain('no path');
      else expect(last(steps).stats['path length']).toBe(expected);
    }
  });
  it.each(SEEDS)('DFS and greedy find a path exactly when one exists (seed %i)', (seed) => {
    for (const id of ['grid-dfs', 'grid-greedy']) {
      const input = makeInput(id, seed);
      const reachable = refCost(parseProblem(input)) !== Infinity;
      const explain = last(byId(id).run(input)).explain;
      expect(explain.includes('no path')).toBe(!reachable);
    }
  });
});

describe('weighted searches', () => {
  it.each(SEEDS)("Dijkstra and A* find the cheapest cost with mud (seed %i)", (seed) => {
    for (const id of ['grid-dijkstra', 'grid-astar']) {
      const input = makeInput(id, seed);
      const expected = refCost(parseProblem(input));
      const explain = last(byId(id).run(input)).explain;
      if (expected === Infinity) expect(explain).toContain('no path');
      else expect(explain).toContain(`Total cost ${expected}`);
    }
  });
  it('A* explores no more cells than Dijkstra on the default board', () => {
    const a = last(byId('grid-astar').run(makeInput('grid-astar'))).stats['cells explored'];
    const d = last(byId('grid-dijkstra').run(makeInput('grid-dijkstra'))).stats['cells explored'];
    expect(a).toBeLessThanOrEqual(d);
  });
});

describe('input errors', () => {
  it('rejects a wall on the start cell', () => {
    const p = () => byId('grid-bfs').run(makeInput('grid-bfs', undefined, { walls: '65' }));
    expect(p).toThrow(/start cell is a wall/);
  });
  it('rejects identical start and goal', () => {
    expect(() => byId('grid-bfs').run(makeInput('grid-bfs', undefined, { goal: '65' }))).toThrow(/different/);
  });
  it('reports an unreachable goal', () => {
    const walls = Array.from({ length: 9 }, (_, r) => r * 16 + 8).join(',');
    expect(last(byId('grid-bfs').run(makeInput('grid-bfs', undefined, { walls }))).explain).toContain('no path');
  });
});

describe('maze generators', () => {
  it.each(['maze-backtracker', 'maze-prim', 'maze-kruskal'])('%s builds a perfect maze', (id) => {
    for (const size of [2, 4, 7, 9]) {
      const built = buildForm(byId(id).input.form!, { size: String(size), seed: '5' });
      const state = last(byId(id).run((built as any).input)).state as GridState;
      const open = state.walls.filter((w) => !w).length;
      // A perfect maze has n² cells and n²-1 passages, so it is a spanning tree.
      expect(open).toBe(size * size + size * size - 1);
      const start = state.walls.findIndex((w) => !w);
      const seen = new Set([start]);
      const stack = [start];
      while (stack.length) {
        const c = stack.pop()!;
        for (const nb of neighbors({ rows: state.rows, cols: state.cols, walls: state.walls } as Problem, c)) if (!seen.has(nb)) (seen.add(nb), stack.push(nb));
      }
      expect(seen.size).toBe(open);
    }
  });
  it('is deterministic for a seed', () => {
    const run = () => last(byId('maze-prim').run((buildForm(byId('maze-prim').input.form!, { size: '5', seed: '9' }) as any).input)).state;
    expect(run()).toEqual(run());
  });
});
