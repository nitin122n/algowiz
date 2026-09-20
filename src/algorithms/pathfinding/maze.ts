/** Maze generators. Cells sit at odd coordinates of a (2n+1) x (2n+1) grid; carving removes the wall between two cells. */
import { mulberry32 } from '../../core/random';
import { int } from '../../core/forms';
import type { AlgorithmDef, Complexity, FieldSpec, FormInput, GridState, Mark, Step } from '../../core/step';
import { Rec } from '../../core/tracer';
import { theoryFor } from '../theory';
import { shape, spread } from '../../core/scale';

/** Form for every maze generator: size in cells and a seed. */
const FORM: FieldSpec[] = [
  { key: 'size', label: 'Maze size (cells per side)', type: 'int', default: 6, min: 2, max: 9 },
  { key: 'seed', label: 'Seed', type: 'int', default: 3, min: 0, max: 9999, help: 'The same seed always builds the same maze.' },
];

/** Working maze: wall grid plus the seeded random source. */
class Maze {
  readonly walls: boolean[];
  readonly dim: number;
  readonly rnd: () => number;
  readonly rec = new Rec<GridState>(['cells carved']);
  /** Cells drawn as finished. */
  done = new Set<number>();
  /** Cells drawn as the working set (stack or frontier). */
  work = new Set<number>();
  active: number | null = null;

  /**
   * @param n - cells per side
   * @param seed - random seed
   */
  constructor(
    readonly n: number,
    seed: number,
  ) {
    this.dim = 2 * n + 1;
    this.walls = Array(this.dim * this.dim).fill(true);
    this.rnd = mulberry32(seed * 104729 + 1);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) this.walls[this.cell(i, j)] = false;
  }

  /** Grid index of maze cell (i, j). */
  cell(i: number, j: number): number {
    return (2 * i + 1) * this.dim + 2 * j + 1;
  }

  /** Removes the wall between two adjacent maze cells given as grid indices. */
  carve(a: number, b: number): void {
    this.walls[(a + b) / 2] = false;
    this.rec.count('cells carved');
  }

  /** Uniform random integer in [0, k). */
  pick(k: number): number {
    return Math.floor(this.rnd() * k);
  }

  /** Shuffles an array in place with the seeded generator. */
  shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.pick(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Grid indices of the cells two steps away in each direction, still inside the maze. */
  around(c: number): number[] {
    const r = Math.floor(c / this.dim);
    const col = c % this.dim;
    const out: number[] = [];
    if (r - 2 > 0) out.push(c - 2 * this.dim);
    if (col + 2 < this.dim) out.push(c + 2);
    if (r + 2 < this.dim) out.push(c + 2 * this.dim);
    if (col - 2 > 0) out.push(c - 2);
    return out;
  }

  /** Pushes a frame. */
  snap(line: number | null, explain: string): void {
    // Memory = cells already carved into the maze plus the working stack or frontier.
    this.rec.raise('memory', this.done.size + this.work.size);
    const marks: Mark[] = [];
    this.done.forEach((index) => marks.push({ kind: 'visited', index }));
    this.work.forEach((index) => marks.push({ kind: 'frontier', index }));
    if (this.active !== null) marks.push({ kind: 'active', index: this.active });
    this.rec.snap({ rows: this.dim, cols: this.dim, walls: [...this.walls] }, marks, line, explain);
  }

  /** All maze cells as grid indices. */
  cells(): number[] {
    return Array.from({ length: this.n * this.n }, (_, k) => this.cell(Math.floor(k / this.n), k % this.n));
  }
}

/** Fields a maze generator provides. */
interface MazeSpec {
  id: string;
  name: string;
  summary: string;
  complexity: Complexity;
  pseudocode: string[];
  run: (m: Maze) => void;
}

/** Builds a definition for a maze generator. */
function defineMaze(s: MazeSpec): AlgorithmDef<FormInput, GridState> {
  return {
    id: s.id,
    name: s.name,
    family: 'graph',
    group: 'Maze generation',
    summary: s.summary,
    complexity: s.complexity,
    pseudocode: s.pseudocode,
    theory: theoryFor(s.id),
    input: { kind: 'form', maxSize: 100, defaultSize: 0, form: FORM, randomize: (seed) => ({ size: String(4 + (seed % 5)), seed: String(seed) }), randomLabel: 'New maze' },
    view: 'grid',
    scale: { sizes: spread(2, 9), unit: 'cells', shapes: [shape('random', 'Random seeds', 3)], make: (n, _s, seed) => ({ size: n, seed }), sizeOf: (i) => Number(i.size) ** 2 },
    run(input): Step<GridState>[] {
      const m = new Maze(int(input, 'size'), int(input, 'seed'));
      m.snap(0, 'Start with a solid block of walls and an empty cell in every room.');
      s.run(m);
      m.work.clear();
      m.active = null;
      m.snap(null, 'Done: every cell is connected to every other by exactly one path.');
      return m.rec.steps;
    },
  };
}

/** Recursive backtracker (depth-first) maze. */
export const mazeBacktracker = defineMaze({
  id: 'maze-backtracker',
  name: 'Recursive Backtracker',
  summary: 'Walks to a random unvisited neighbor, carving as it goes, and backs up when it hits a dead end. Makes long winding corridors.',
  complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
  pseudocode: ['stack = [a random cell]; mark it visited', 'while the stack is not empty', '  cell = top of stack', '  if cell has an unvisited neighbor: carve to a random one, push it', '  else: pop (back up)'],
  run(m) {
    const start = m.cell(0, 0);
    const seen = new Set([start]);
    const stack = [start];
    m.done.add(start);
    while (stack.length) {
      const c = stack[stack.length - 1];
      m.active = c;
      const free = m.around(c).filter((x) => !seen.has(x));
      if (free.length) {
        const nb = free[m.pick(free.length)];
        m.carve(c, nb);
        seen.add(nb);
        stack.push(nb);
        m.done.add(nb);
        m.work = new Set(stack);
        m.snap(3, `Carve from cell ${c} to a random unvisited neighbor and move there.`);
      } else {
        stack.pop();
        m.work = new Set(stack);
        m.snap(4, 'Dead end: back up one cell.');
      }
    }
  },
});

/** Randomized Prim's maze. */
export const mazePrim = defineMaze({
  id: 'maze-prim',
  name: "Randomized Prim's",
  summary: 'Grows the maze from one cell by repeatedly connecting a random frontier cell to the maze. Makes many short dead ends.',
  complexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(n)' },
  pseudocode: ['mark a random cell as part of the maze; add its neighbors to the frontier', 'while the frontier is not empty', '  pick a random frontier cell', '  connect it to a random neighbor that is already in the maze', '  add its other neighbors to the frontier'],
  run(m) {
    const start = m.cell(0, 0);
    const inMaze = new Set([start]);
    const frontier = new Set(m.around(start));
    m.done.add(start);
    m.work = new Set(frontier);
    m.snap(0, 'Begin with one cell; its neighbors form the frontier.');
    while (frontier.size) {
      const list = [...frontier];
      const c = list[m.pick(list.length)];
      frontier.delete(c);
      const link = m.around(c).filter((x) => inMaze.has(x));
      m.carve(c, link[m.pick(link.length)]);
      inMaze.add(c);
      m.done.add(c);
      for (const nb of m.around(c)) if (!inMaze.has(nb)) frontier.add(nb);
      m.work = new Set(frontier);
      m.active = c;
      m.snap(3, `Pick frontier cell ${c} at random and connect it to the maze.`);
    }
  },
});

/** Randomized Kruskal's maze. */
export const mazeKruskal = defineMaze({
  id: 'maze-kruskal',
  name: "Randomized Kruskal's",
  summary: 'Puts every cell in its own set, then removes walls in random order whenever they join two different sets.',
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  pseudocode: ['every cell starts in its own set', 'list every wall between two cells; shuffle the list', 'for each wall in order', '  if the two cells are in different sets: remove the wall and merge the sets', '  else: keep the wall (removing it would make a loop)'],
  run(m) {
    const root = new Map(m.cells().map((c) => [c, c]));
    /** Set representative of a cell. */
    const find = (x: number): number => (root.get(x) === x ? x : (root.set(x, find(root.get(x) as number)), root.get(x) as number));
    const walls: Array<[number, number]> = [];
    for (const c of m.cells()) {
      const right = c + 2;
      const down = c + 2 * m.dim;
      if (c % m.dim + 2 < m.dim) walls.push([c, right]);
      if (Math.floor(c / m.dim) + 2 < m.dim) walls.push([c, down]);
    }
    m.shuffle(walls);
    m.snap(1, `${walls.length} walls between cells, shuffled into random order.`);
    for (const [a, b] of walls) {
      m.active = null;
      if (find(a) !== find(b)) {
        root.set(find(a), find(b));
        m.carve(a, b);
        m.done.add(a);
        m.done.add(b);
        m.work = new Set([a, b]);
        m.snap(3, `Cells ${a} and ${b} are in different sets: remove the wall between them and merge.`);
      }
    }
  },
});
