/** Shared grid plumbing for pathfinding and maze algorithms. */
import { InputError, int, nums } from '../../core/forms';
import { mulberry32 } from '../../core/random';
import type { AlgorithmDef, Complexity, FieldSpec, FormInput, GridState, Mark, Step } from '../../core/step';
import { Rec } from '../../core/tracer';
import { theoryFor } from '../theory';
import { shape } from '../../core/scale';

/** A parsed grid-search problem. */
export interface Problem {
  rows: number;
  cols: number;
  walls: boolean[];
  /** Cost of entering each cell (1 unless marked as mud). */
  cost: number[];
  start: number;
  goal: number;
}

/** Cost of a mud cell. */
export const MUD_COST = 5;

/**
 * Walls for the default board: two vertical barriers with gaps, so searches have something to route around.
 * @param rows - grid rows
 * @param cols - grid columns
 * @returns wall cell indices as text
 */
export function presetWalls(rows: number, cols: number): string {
  const out: number[] = [];
  const c1 = Math.floor(cols / 3);
  const c2 = Math.floor((2 * cols) / 3);
  for (let r = 0; r < rows; r++) {
    if (r !== rows - 2) out.push(r * cols + c1);
    if (r !== 1) out.push(r * cols + c2);
  }
  return out.join(', ');
}

/** Default board size for pathfinding. */
const ROWS = 9;
const COLS = 16;

/**
 * Form fields shared by pathfinding algorithms.
 * @param mud - include a field for high-cost "mud" cells
 * @returns form fields and a random-obstacles generator
 */
export function gridInput(mud: boolean): { form: FieldSpec[]; randomize: (seed: number) => Record<string, string> } {
  const mid = Math.floor(ROWS / 2);
  const form: FieldSpec[] = [
    { key: 'rows', label: 'Rows', type: 'int', default: ROWS, min: 3, max: 14 },
    { key: 'cols', label: 'Columns', type: 'int', default: COLS, min: 3, max: 20 },
    { key: 'start', label: 'Start cell', type: 'int', default: mid * COLS + 1, min: 0 },
    { key: 'goal', label: 'Goal cell', type: 'int', default: mid * COLS + COLS - 2, min: 0 },
    { key: 'walls', label: 'Walls (cell numbers)', type: 'numbers', default: presetWalls(ROWS, COLS), help: 'Click cells on the board to add or remove walls. Cells are numbered row by row from 0.' },
  ];
  if (mud) form.push({ key: 'mud', label: `Mud (cost ${MUD_COST})`, type: 'numbers', default: [4 * COLS + 3, 4 * COLS + 4, 4 * COLS + 5, 3 * COLS + 4, 5 * COLS + 4].join(', '), help: 'Entering a mud cell costs 5 instead of 1.' });
  return {
    form,
    randomize: (seed) => {
      const rnd = mulberry32(seed * 7919);
      const walls: number[] = [];
      const mid2 = Math.floor(ROWS / 2);
      for (let i = 0; i < ROWS * COLS; i++) {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        const nearEnds = r === mid2 && (c <= 1 || c >= COLS - 2);
        if (!nearEnds && rnd() < 0.27) walls.push(i);
      }
      const out: Record<string, string> = { rows: String(ROWS), cols: String(COLS), start: String(mid2 * COLS + 1), goal: String(mid2 * COLS + COLS - 2), walls: walls.join(', ') };
      if (mud) out.mud = Array.from({ length: 8 }, () => Math.floor(rnd() * ROWS * COLS)).filter((i) => !walls.includes(i)).join(', ');
      return out;
    },
  };
}

/**
 * Builds and validates a {@link Problem}.
 * @param input - parsed form
 * @throws InputError when the start or goal is off the board, blocked, or the same cell
 */
export function parseProblem(input: FormInput): Problem {
  const rows = int(input, 'rows');
  const cols = int(input, 'cols');
  const n = rows * cols;
  const start = int(input, 'start');
  const goal = int(input, 'goal');
  if (start >= n || goal >= n) throw new InputError(`Start and goal must be cell numbers from 0 to ${n - 1}.`);
  if (start === goal) throw new InputError('Start and goal must be different cells.');
  const walls = Array(n).fill(false);
  for (const w of nums(input, 'walls')) if (w >= 0 && w < n) walls[w] = true;
  if (walls[start]) throw new InputError('The start cell is a wall. Remove it from the walls list.');
  if (walls[goal]) throw new InputError('The goal cell is a wall. Remove it from the walls list.');
  const cost = Array(n).fill(1);
  for (const m of nums(input, 'mud')) if (m >= 0 && m < n && !walls[m]) cost[m] = MUD_COST;
  return { rows, cols, walls, cost, start, goal };
}

/**
 * Open neighbors of a cell in fixed order: up, right, down, left.
 * @param p - the problem
 * @param i - cell index
 * @returns neighbor cell indices that are on the board and not walls
 */
export function neighbors(p: Problem, i: number): number[] {
  const r = Math.floor(i / p.cols);
  const c = i % p.cols;
  const out: number[] = [];
  if (r > 0) out.push(i - p.cols);
  if (c < p.cols - 1) out.push(i + 1);
  if (r < p.rows - 1) out.push(i + p.cols);
  if (c > 0) out.push(i - 1);
  return out.filter((j) => !p.walls[j]);
}

/**
 * Manhattan distance between two cells.
 * @param p - the problem
 * @param a - first cell
 * @param b - second cell
 */
export const manhattan = (p: Problem, a: number, b: number): number => Math.abs(Math.floor(a / p.cols) - Math.floor(b / p.cols)) + Math.abs((a % p.cols) - (b % p.cols));

/** Records a grid search run. */
export class GridRec {
  readonly rec: Rec<GridState>;
  visited = new Set<number>();
  frontier = new Set<number>();
  /** Second visited set for bidirectional search (drawn with the `insert` color). */
  visitedB = new Set<number>();
  path = new Set<number>();
  /** Cell being expanded, or null. */
  active: number | null = null;

  /**
   * @param p - the problem
   * @param counters - counter names to show
   */
  constructor(
    readonly p: Problem,
    counters: string[],
  ) {
    this.rec = new Rec<GridState>(counters);
  }

  /** The recorded steps. */
  get steps(): Step<GridState>[] {
    return this.rec.steps;
  }

  /** Increases a counter. */
  count(name: string, by = 1): void {
    this.rec.count(name, by);
  }

  /** Raises a counter to at least `value`. */
  raise(name: string, value: number): void {
    this.rec.raise(name, value);
  }

  /**
   * Pushes a frame from the current sets.
   * @param line - active pseudocode line
   * @param explain - sentence for the frame
   */
  snap(line: number | null, explain: string): void {
    // Memory = cells the search is holding on to (explored plus waiting).
    this.rec.raise('memory', this.visited.size + this.visitedB.size + this.frontier.size);
    const marks: Mark[] = [];
    this.visited.forEach((index) => marks.push({ kind: 'visited', index }));
    this.visitedB.forEach((index) => marks.push({ kind: 'insert', index }));
    this.frontier.forEach((index) => marks.push({ kind: 'frontier', index }));
    this.path.forEach((index) => marks.push({ kind: 'path', index }));
    if (this.active !== null) marks.push({ kind: 'active', index: this.active });
    const { p } = this;
    this.rec.snap({ rows: p.rows, cols: p.cols, walls: p.walls, cost: p.cost.some((c) => c > 1) ? p.cost : undefined, start: p.start, goal: p.goal }, marks, line, explain);
  }

  /**
   * Walks parent links from `end` back to the start and highlights the route.
   * @param parent - parent cell per cell (-1 for none)
   * @param end - cell to trace from
   * @returns the route length in steps
   */
  trace(parent: number[], end: number): number {
    let len = 0;
    for (let c = end; c !== -1; c = parent[c]) {
      this.path.add(c);
      len++;
    }
    return len - 1;
  }
}

/** Fields a pathfinding file provides. */
export interface PathSpec {
  id: string;
  name: string;
  group?: string;
  summary: string;
  complexity: Complexity;
  pseudocode: string[];
  mud?: boolean;
  run: (input: FormInput) => Step<GridState>[];
}

/**
 * Builds a definition for a grid pathfinding algorithm.
 * @param s - algorithm-specific fields
 */
export function definePath(s: PathSpec): AlgorithmDef<FormInput, GridState> {
  const inp = gridInput(!!s.mud);
  return {
    id: s.id,
    name: s.name,
    family: 'graph',
    group: s.group ?? 'Pathfinding on a grid',
    summary: s.summary,
    complexity: s.complexity,
    pseudocode: s.pseudocode,
    theory: theoryFor(s.id),
    input: { kind: 'form', maxSize: 100, defaultSize: 0, form: inp.form, randomize: inp.randomize, randomLabel: 'Random walls' },
    run: s.run,
    view: 'grid',
    scale: {
      sizes: [3, 4, 5, 6, 8, 10, 12, 14],
      unit: 'cells',
      shapes: [shape('open', 'Open board'), shape('walls', 'Board with random walls', 3)],
      make: (side, sh, seed) => {
        const mid = Math.floor(side / 2);
        const start = mid * side;
        const goal = mid * side + side - 1;
        const rnd = mulberry32(seed * 7907 + side);
        const walls = sh === 'open' ? [] : Array.from({ length: side * side }, (_, i) => i).filter((i) => i !== start && i !== goal && rnd() < 0.25);
        return { rows: side, cols: side, start, goal, walls, mud: [] };
      },
      sizeOf: (i) => Number(i.rows) * Number(i.cols),
    },
  };
}
