/**
 * Core contract shared by every algorithm, renderer, and UI panel.
 *
 * An algorithm is a pure function that records its whole run up front as an array of
 * {@link Step}s. The player then moves an index over that array, so play, pause, step
 * forward, step back, scrub, and speed changes work identically for every algorithm.
 */

/** Algorithm family; decides sidebar grouping. */
export type Family =
  | 'sorting'
  | 'searching'
  | 'linkedlist'
  | 'graph'
  | 'tree'
  | 'dp'
  | 'strings'
  | 'classics';

/** Semantic highlight kinds. Views map each kind to a color, a shape, and a legend entry. */
export type MarkKind =
  | 'compare'
  | 'swap'
  | 'active'
  | 'found'
  | 'sorted'
  | 'pivot'
  | 'range'
  | 'insert'
  | 'delete'
  | 'notfound'
  | 'pointer'
  | 'frontier'
  | 'visited'
  | 'path';

/** A highlight on one index (array position or list node). */
export interface Mark {
  /** What is happening at this index. */
  kind: MarkKind;
  /** Array position or node index the mark applies to. */
  index: number;
  /** Optional short label drawn near the element, e.g. "lo", "mid", "hi". */
  label?: string;
}

/** One frame of an algorithm run. `S` is the family-specific state snapshot. */
export interface Step<S> {
  /** Full snapshot needed to draw this frame. */
  state: S;
  /** Highlights for this frame. */
  marks: Mark[];
  /** Active pseudocode line index, or null when no line applies. */
  line: number | null;
  /** One plain-English sentence describing what just happened. */
  explain: string;
  /** Running counters (comparisons, swaps, ...). Values never decrease across steps. */
  stats: Record<string, number>;
}

/** Which renderer draws this algorithm's state. */
export type ViewKind = 'bars' | 'cells' | 'grid' | 'graph' | 'tree' | 'list' | 'text' | 'hanoi';

/** Asymptotic complexity summary. */
export interface Complexity {
  best: string;
  average: string;
  worst: string;
  space: string;
}

/** Theory text shown in the Theory panel. Every field is optional. */
export interface Theory {
  /** Loop invariant or key property. */
  invariant?: string;
  /** Correctness proof as ordered statements. */
  proof?: string[];
  /** Extra notes: stability, best/worst case, applications. */
  notes?: string[];
}

/** One field of a generic input form. Values are parsed by `core/forms.ts`. */
export type FieldSpec =
  | { key: string; label: string; type: 'numbers'; default: string; max?: number; help?: string }
  | { key: string; label: string; type: 'int'; default: number; min?: number; max?: number; help?: string }
  | { key: string; label: string; type: 'text'; default: string; help?: string; maxLength?: number }
  | { key: string; label: string; type: 'select'; default: string; options: Array<{ value: string; label: string }> };

/** Parsed value of a form field: numbers, an integer, or text. */
export type FormValue = number[] | number | string;

/** Input to every algorithm whose spec kind is `form`. */
export type FormInput = Record<string, FormValue>;

/** Describes the input controls the UI must offer for an algorithm. */
export interface InputSpec {
  /** `array`: numbers only. `array+target`: numbers plus a search target. `list`: linked-list input. `form`: generic fields. */
  kind: 'array' | 'array+target' | 'list' | 'form';
  /** Fields for the generic form (kind `form`). */
  form?: FieldSpec[];
  /** Builds raw field text for the "Random" button from a seed (kind `form`). */
  randomize?: (seed: number) => Record<string, string>;
  /** Label for the random button; defaults to "Random". */
  randomLabel?: string;
  /** Largest allowed input size; keeps step arrays small enough for memory. */
  maxSize: number;
  /** Size used by the "random" generator by default. */
  defaultSize: number;
  /** When true the shell sorts the array before running (binary search and friends). */
  needsSorted?: boolean;
  /** Extra numeric fields the input panel must show (linked lists: `value` and/or `index`). */
  fields?: Array<'value' | 'index'>;
}

/** Definition of one algorithm; exactly one is exported per algorithm file. */
export interface AlgorithmDef<I = unknown, S = unknown> {
  /** Stable slug used in URLs, e.g. "bubble-sort". */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Family used for sidebar grouping. */
  family: Family;
  /** Optional sub-group inside the family, e.g. "Singly linked list". */
  group?: string;
  /** One-sentence description. */
  summary: string;
  /** Asymptotic complexity. */
  complexity: Complexity;
  /** Pseudocode lines; `Step.line` indexes into this array. */
  pseudocode: string[];
  /** Theory content. */
  theory: Theory;
  /** Input controls the UI must offer. */
  input: InputSpec;
  /** Runs the algorithm and records every step. Must be pure and deterministic. */
  run: (input: I) => Step<S>[];
  /** Renderer that draws `Step.state`. */
  view: ViewKind;
  /** How to generate inputs of growing size for the Complexity Lab. Array, search, and list algorithms get one automatically. */
  scale?: ScaleSpec<I>;
}

/** One kind of input the Complexity Lab measures (sorted, random, reversed ...). */
export interface ScaleShape {
  id: string;
  label: string;
  /** How many random seeds to average; 1 for deterministic shapes. */
  seeds: number;
}

/** Recipe for inputs of growing size, used to measure how an algorithm scales. */
export interface ScaleSpec<I = unknown> {
  /** Input sizes to measure, smallest first. */
  sizes: number[];
  /** Name of the size on the x axis, e.g. "elements", "nodes", "cells". */
  unit: string;
  shapes: ScaleShape[];
  /**
   * Builds one input.
   * @param n - size
   * @param shape - shape id
   * @param seed - random seed
   */
  make: (n: number, shape: string, seed: number) => I;
  /** Size of an input the user built, so the current run can be placed on the chart. */
  sizeOf: (input: I) => number;
}


/** State drawn by {@link ViewKind} `bars` for sorting algorithms. */
export interface ArrayState {
  array: number[];
}

/** State drawn by `bars` for searching algorithms. `result` is set only on the final step. */
export interface SearchState {
  array: number[];
  target: number;
  /** Index of the match, -1 when absent, or null while the search is still running. */
  result: number | null;
}

/** Input to every search algorithm. */
export interface SearchInput {
  array: number[];
  target: number;
}

/** Linked-list kinds. */
export type ListKind = 'singly' | 'doubly' | 'circular';

/** Linked-list operations supported in Phase 1. */
export type ListOp =
  | 'traverse'
  | 'insert_head'
  | 'insert_tail'
  | 'insert_pos'
  | 'delete_head'
  | 'delete_tail'
  | 'delete_pos'
  | 'search'
  | 'reverse'
  | 'middle';

/** A cell value in a table: text, number, or empty. */
export type Cell = string | number | null;

/** State drawn by the `cells` view: a labeled table (DP tables, sieve, stack, queue ...). Marks use the flat index `row * cols + col`. */
export interface TableState {
  rows: number;
  cols: number;
  /** Row-major cell contents, length rows * cols. */
  cells: Cell[];
  rowLabels?: string[];
  colLabels?: string[];
  /** Short line drawn above the table. */
  caption?: string;
}

/** State drawn by the `grid` view (pathfinding, mazes, Sudoku, N-Queens). Marks use the flat index `row * cols + col`. */
export interface GridState {
  rows: number;
  cols: number;
  walls: boolean[];
  /** Movement cost per cell (mud); absent means every cell costs 1. */
  cost?: number[];
  start?: number;
  goal?: number;
  /** Text drawn in each cell (digits, queens). */
  text?: string[];
  /** Cells that are fixed clues (Sudoku givens). */
  fixed?: boolean[];
  /** Draw thicker borders every `block` cells (3 for Sudoku). */
  block?: number;
}

/** State drawn by the `graph` view. Marks use node indices; edges are marked through `edgeMarks`. */
export interface GraphState {
  nodes: Array<{ x: number; y: number; label: string; sub?: string }>;
  edges: Array<{ from: number; to: number; w?: number }>;
  directed: boolean;
  weighted: boolean;
  /** Marked edges keyed by {@link edgeKey}. */
  edgeMarks: Record<string, MarkKind>;
}

/**
 * Key used to look up an edge in `GraphState.edgeMarks`.
 * @param a - one endpoint
 * @param b - other endpoint
 * @param directed - whether direction matters
 * @returns a stable string key
 */
export function edgeKey(a: number, b: number, directed: boolean): string {
  return directed ? `${a}>${b}` : `${Math.min(a, b)}-${Math.max(a, b)}`;
}

/** One node of a drawn tree. */
export interface TreeNode {
  label: string;
  /** Child node ids in order; `null` keeps a slot empty in binary trees. */
  children: Array<number | null>;
  color?: 'red' | 'black';
  /** Small caption under the node (height, sum, rank ...). */
  sub?: string;
}

/** State drawn by the `tree` view. Marks use node ids. */
export interface TreeState {
  nodes: Record<number, TreeNode>;
  /** Root ids; several roots draw a forest (union-find). */
  roots: number[];
  /** Binary trees are laid out by in-order rank; others by subtree width. */
  binary: boolean;
  /** Optional array drawn under the tree (heaps). */
  array?: Array<number | string>;
  arrayLabel?: string;
  /** True when marks on node ids should also light up the array cell with the same index (heaps, union-find). */
  arrayIsNodeIds?: boolean;
}

/** State drawn by the `text` view (string matching). Marks index into `text`. */
export interface TextState {
  text: string;
  pattern: string;
  /** Position in `text` where the pattern is currently aligned. */
  shift: number;
  /** Optional helper table shown below (failure function, Z array, hashes). */
  table?: Array<number | string>;
  tableLabel?: string;
}

/** State drawn by the `hanoi` view. */
export interface HanoiState {
  /** Disk sizes on each peg, bottom first. */
  pegs: number[][];
  n: number;
}

/** State drawn by the `list` view. */
export interface ListState {
  /** Node values in list order. */
  nodes: number[];
  /** Which pointer style to draw. */
  kind: ListKind;
}

/** Input to every linked-list algorithm. */
export interface ListInput {
  list: number[];
  /** Value used by insert and search. */
  value: number;
  /** Position used by positional insert and delete. */
  index: number;
}
