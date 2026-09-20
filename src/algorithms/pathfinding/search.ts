import type { GridState, Step } from '../../core/step';
import { definePath, GridRec, manhattan, neighbors, parseProblem, type Problem } from './util';

/** Reports success or failure at the end of a search and returns the steps. */
function finish(r: GridRec, parent: number[], found: boolean, extra = ''): Step<GridState>[] {
  r.frontier.clear();
  r.active = null;
  if (found) {
    const len = r.trace(parent, r.p.goal);
    r.raise('path length', len);
    r.snap(null, `Reached the goal. The path is ${len} moves long.${extra}`);
  } else r.snap(null, 'The frontier is empty and the goal was never reached: there is no path.');
  return r.steps;
}

/** Breadth-first search on a grid: guarantees the shortest path in moves. */
export const gridBfs = definePath({
  id: 'grid-bfs',
  name: 'Breadth-First Search',
  summary: 'Explores in rings of increasing distance, so the first time it reaches the goal is via a shortest path.',
  complexity: { best: 'O(1)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  pseudocode: ['queue = [start]', 'while queue is not empty', '  cell = dequeue()', '  if cell is the goal: stop', '  for each open neighbor not yet seen: mark seen, remember parent, enqueue'],
  run(input) {
    const p = parseProblem(input);
    const r = new GridRec(p, ['cells explored', 'path length']);
    const parent: number[] = Array(p.rows * p.cols).fill(-1);
    const seen = new Set([p.start]);
    const q = [p.start];
    r.frontier.add(p.start);
    r.snap(0, 'Start with the start cell in the queue.');
    while (q.length) {
      const c = q.shift() as number;
      r.frontier.delete(c);
      r.active = c;
      r.count('cells explored');
      if (c === p.goal) {
        r.visited.add(c);
        return finish(r, parent, true);
      }
      for (const n of neighbors(p, c)) if (!seen.has(n)) (seen.add(n), (parent[n] = c), q.push(n), r.frontier.add(n));
      r.visited.add(c);
      r.snap(4, `Explore cell ${c}: add its unseen neighbors to the queue (${q.length} waiting).`);
    }
    return finish(r, parent, false);
  },
});

/** Depth-first search on a grid: finds a path, not necessarily a short one. */
export const gridDfs = definePath({
  id: 'grid-dfs',
  name: 'Depth-First Search',
  summary: 'Dives down one corridor as far as it can before backing up. It finds a path, but rarely the shortest.',
  complexity: { best: 'O(1)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' },
  pseudocode: ['stack = [start]', 'while stack is not empty', '  cell = pop()', '  if cell is the goal: stop', '  if cell not visited: mark it; push its open neighbors'],
  run(input) {
    const p = parseProblem(input);
    const r = new GridRec(p, ['cells explored', 'path length']);
    const parent: number[] = Array(p.rows * p.cols).fill(-1);
    const stack = [p.start];
    r.frontier.add(p.start);
    r.snap(0, 'Start with the start cell on the stack.');
    while (stack.length) {
      const c = stack.pop() as number;
      if (r.visited.has(c)) continue;
      r.frontier.delete(c);
      r.active = c;
      r.visited.add(c);
      r.count('cells explored');
      if (c === p.goal) return finish(r, parent, true, ' Depth-first search does not guarantee the shortest path.');
      for (const n of neighbors(p, c).reverse()) {
        if (!r.visited.has(n)) {
          parent[n] = c;
          stack.push(n);
          r.frontier.add(n);
        }
      }
      r.snap(4, `Explore cell ${c}: push its unvisited neighbors (${stack.length} on the stack).`);
    }
    return finish(r, parent, false);
  },
});

/** Which priority a best-first search uses. */
type Mode = 'dijkstra' | 'astar' | 'greedy';

/** Shared best-first search used by Dijkstra, A*, and greedy best-first. */
function bestFirst(p: Problem, mode: Mode): Step<GridState>[] {
  const r = new GridRec(p, ['cells explored', 'path length']);
  const n = p.rows * p.cols;
  const g: number[] = Array(n).fill(Infinity);
  const parent: number[] = Array(n).fill(-1);
  const closed = new Set<number>();
  const open = new Set([p.start]);
  g[p.start] = 0;
  r.frontier.add(p.start);
  const h = (c: number) => manhattan(p, c, p.goal);
  const prio = (c: number) => (mode === 'dijkstra' ? g[c] : mode === 'astar' ? g[c] + h(c) : h(c));
  const what = mode === 'dijkstra' ? 'the lowest cost so far' : mode === 'astar' ? 'the lowest cost so far plus estimate' : 'the smallest estimate to the goal';
  r.snap(0, 'Start with the start cell as the only candidate.');
  while (open.size) {
    let c = -1;
    open.forEach((x) => {
      if (c < 0 || prio(x) < prio(c) || (prio(x) === prio(c) && h(x) < h(c))) c = x;
    });
    open.delete(c);
    r.frontier.delete(c);
    closed.add(c);
    r.visited.add(c);
    r.active = c;
    r.count('cells explored');
    if (c === p.goal) return finish(r, parent, true, mode === 'greedy' ? ' Greedy search is fast but does not guarantee the cheapest path.' : ` Total cost ${g[c]}.`);
    for (const nb of neighbors(p, c)) {
      const cand = g[c] + p.cost[nb];
      if (closed.has(nb)) continue;
      if (mode === 'greedy' ? !open.has(nb) : cand < g[nb]) {
        g[nb] = cand;
        parent[nb] = c;
        open.add(nb);
        r.frontier.add(nb);
      }
    }
    r.snap(2, `Pick cell ${c} with ${what} (${mode === 'dijkstra' ? `cost ${g[c]}` : mode === 'astar' ? `cost ${g[c]} + estimate ${h(c)}` : `estimate ${h(c)}`}). ${open.size} candidate${open.size === 1 ? '' : 's'} remain.`);
  }
  return finish(r, parent, false);
}

/** Dijkstra's algorithm on a grid with mud. */
export const gridDijkstra = definePath({
  id: 'grid-dijkstra',
  name: "Dijkstra's Algorithm",
  mud: true,
  summary: 'Always expands the cheapest known cell. With mud (cost 5) it routes around costly terrain to find the cheapest path.',
  complexity: { best: 'O(V)', average: 'O(V²)', worst: 'O(V²)', space: 'O(V)' },
  pseudocode: ['cost[start] = 0; candidates = {start}', 'while candidates remain', '  cell = candidate with the lowest cost', '  if cell is the goal: stop', '  for each open neighbor: if cost[cell] + step cost is lower, update it and remember the parent'],
  run: (input) => bestFirst(parseProblem(input), 'dijkstra'),
});

/** A* search with a Manhattan-distance estimate. */
export const gridAStar = definePath({
  id: 'grid-astar',
  name: 'A* Search',
  mud: true,
  summary: 'Like Dijkstra, but steers toward the goal by adding a distance estimate to each cell. It explores far fewer cells.',
  complexity: { best: 'O(d)', average: 'O(b^d)', worst: 'O(b^d)', space: 'O(b^d)' },
  pseudocode: ['cost[start] = 0; candidates = {start}', 'while candidates remain', '  cell = candidate with the lowest cost + estimate', '  if cell is the goal: stop', '  for each open neighbor: if cost[cell] + step cost is lower, update it and remember the parent'],
  run: (input) => bestFirst(parseProblem(input), 'astar'),
});

/** Greedy best-first search. */
export const gridGreedy = definePath({
  id: 'grid-greedy',
  name: 'Greedy Best-First Search',
  summary: 'Always expands the cell that looks closest to the goal. Very fast on open boards, but it can be led into dead ends and detours.',
  complexity: { best: 'O(d)', average: 'O(b^m)', worst: 'O(b^m)', space: 'O(b^m)' },
  pseudocode: ['candidates = {start}', 'while candidates remain', '  cell = candidate with the smallest estimate to the goal', '  if cell is the goal: stop', '  add its unseen open neighbors as candidates'],
  run: (input) => bestFirst(parseProblem(input), 'greedy'),
});

/** Bidirectional breadth-first search: two searches that meet in the middle. */
export const gridBidirectional = definePath({
  id: 'grid-bidirectional',
  name: 'Bidirectional BFS',
  summary: 'Searches from the start and from the goal at the same time and stops when the two searches touch.',
  complexity: { best: 'O(1)', average: 'O(b^(d/2))', worst: 'O(V + E)', space: 'O(b^(d/2))' },
  pseudocode: ['forward queue = [start]; backward queue = [goal]', 'while both queues have cells', '  expand one cell from the forward search, then one from the backward search', '  if the searches touch: stop', '  join the two half-paths'],
  run(input) {
    const p = parseProblem(input);
    const r = new GridRec(p, ['cells explored', 'path length']);
    const n = p.rows * p.cols;
    const parentF: number[] = Array(n).fill(-1);
    const parentB: number[] = Array(n).fill(-1);
    const seenF = new Set([p.start]);
    const seenB = new Set([p.goal]);
    const qF = [p.start];
    const qB = [p.goal];
    r.frontier.add(p.start).add(p.goal);
    r.snap(0, 'Two searches start: one from the start (blue) and one from the goal (teal).');
    /** Expands one cell of a search; returns the meeting cell if the searches touched. */
    const expand = (q: number[], seen: Set<number>, other: Set<number>, parent: number[], mine: Set<number>): number | null => {
      const c = q.shift() as number;
      r.frontier.delete(c);
      mine.add(c);
      r.active = c;
      r.count('cells explored');
      for (const nb of neighbors(p, c)) {
        if (seen.has(nb)) continue;
        seen.add(nb);
        parent[nb] = c;
        if (other.has(nb)) {
          r.active = nb;
          return nb;
        }
        q.push(nb);
        r.frontier.add(nb);
      }
      return null;
    };
    while (qF.length && qB.length) {
      let side = 'forward';
      let meet = expand(qF, seenF, seenB, parentF, r.visited);
      r.snap(2, 'Expand one cell of the forward search.');
      if (meet === null && qB.length) {
        side = 'backward';
        meet = expand(qB, seenB, seenF, parentB, r.visitedB);
        r.snap(2, 'Expand one cell of the backward search.');
      }
      if (meet !== null) {
        r.frontier.clear();
        const len = r.trace(parentF, meet) + r.trace(parentB, meet);
        r.raise('path length', len);
        r.snap(3, `The ${side} search touched the other at cell ${meet}. Joined path: ${len} moves.`);
        return r.steps;
      }
    }
    r.frontier.clear();
    r.snap(3, 'One search ran out of cells without meeting the other: there is no path.');
    return r.steps;
  },
});
