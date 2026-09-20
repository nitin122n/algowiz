import { int, nums, str } from '../../core/forms';
import { mulberry32 } from '../../core/random';
import type { AlgorithmDef, FieldSpec, FormInput, Mark, Step, TreeNode, TreeState } from '../../core/step';
import { Rec } from '../../core/tracer';
import { theoryFor } from '../theory';
import { shape, spread } from '../../core/scale';
import { MAX_KEYS } from './util';

/** Draws a heap stored in an array as a complete binary tree plus the array itself. */
function heapState(a: number[]): TreeState {
  const nodes: Record<number, TreeNode> = {};
  a.forEach((v, i) => {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    nodes[i] = { label: String(v), children: [l < a.length ? l : null, r < a.length ? r : null] };
  });
  return { nodes, roots: a.length ? [0] : [], binary: true, array: [...a], arrayLabel: 'Stored as an array', arrayIsNodeIds: true };
}

/** A min-heap or max-heap with step recording. */
class Heap {
  readonly rec = new Rec<TreeState>(['comparisons', 'swaps', 'memory']);
  silent = true;

  /**
   * @param a - the array holding the heap (mutated in place)
   * @param min - true for a min-heap, false for a max-heap
   */
  constructor(
    public a: number[],
    readonly min: boolean,
  ) {}

  /** True when x should sit above y. */
  better(x: number, y: number): boolean {
    return this.min ? x < y : x > y;
  }

  /** Word for the heap rule, used in explanations. */
  get rule(): string {
    return this.min ? 'smaller' : 'larger';
  }

  /** Records a frame (does nothing while silent). */
  snap(marks: Mark[], line: number | null, explain: string): void {
    if (!this.silent) this.rec.snap(heapState(this.a), marks, line, explain);
  }

  /** Counts a stat (ignored while silent). */
  count(name: string): void {
    if (!this.silent) this.rec.count(name);
  }

  /** Swaps two positions and records it. */
  swap(i: number, j: number, line: number, why: string): void {
    [this.a[i], this.a[j]] = [this.a[j], this.a[i]];
    this.count('swaps');
    this.snap([{ kind: 'swap', index: i }, { kind: 'swap', index: j }], line, why);
  }

  /** Moves the element at `i` up while it beats its parent. */
  siftUp(i: number, line: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      this.count('comparisons');
      if (this.better(this.a[i], this.a[p])) {
        this.snap([{ kind: 'compare', index: i }, { kind: 'compare', index: p }], line, `${this.a[i]} is ${this.rule} than its parent ${this.a[p]}: swap them.`);
        this.swap(i, p, line, `Swap ${this.a[i]} and ${this.a[p]}.`);
        i = p;
      } else {
        this.snap([{ kind: 'compare', index: i }, { kind: 'compare', index: p }], line, `${this.a[i]} is not ${this.rule} than its parent ${this.a[p]}: it stays.`);
        return;
      }
    }
    this.snap([{ kind: 'found', index: 0 }], line, `${this.a[0]} reached the root.`);
  }

  /** Moves the element at `i` down while a child beats it; only positions below `size` count. */
  siftDown(i: number, size: number, line: number): void {
    for (;;) {
      let best = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < size) {
        this.count('comparisons');
        if (this.better(this.a[l], this.a[best])) best = l;
      }
      if (r < size) {
        this.count('comparisons');
        if (this.better(this.a[r], this.a[best])) best = r;
      }
      const marks: Mark[] = [i, l, r].filter((x) => x < size).map((index) => ({ kind: 'compare' as const, index }));
      if (best === i) {
        this.snap(marks, line, `${this.a[i]} is ${this.rule} than (or equal to) its children: it stays.`);
        return;
      }
      this.snap(marks, line, `Child ${this.a[best]} is ${this.rule} than ${this.a[i]}: swap them.`);
      this.swap(i, best, line, `Swap ${this.a[i]} and ${this.a[best]}.`);
      i = best;
    }
  }

  /** Adds a value and sifts it up. */
  insert(v: number, lineAdd: number, lineUp: number): void {
    this.a.push(v);
    this.snap([{ kind: 'insert', index: this.a.length - 1 }], lineAdd, `Append ${v} at the end (the next free slot).`);
    this.siftUp(this.a.length - 1, lineUp);
  }
}

/** Form fields shared by the heap algorithms. */
function heapForm(keys: string, withValue: boolean): FieldSpec[] {
  const f: FieldSpec[] = [
    { key: 'kind', label: 'Heap type', type: 'select', default: 'min', options: [{ value: 'min', label: 'Min-heap (smallest on top)' }, { value: 'max', label: 'Max-heap (largest on top)' }] },
    { key: 'keys', label: withValue ? 'Starting keys' : 'Keys', type: 'numbers', default: keys, max: MAX_KEYS, help: withValue ? 'Inserted one by one to build the starting heap.' : undefined },
  ];
  if (withValue) f.push({ key: 'value', label: 'Value', type: 'int', default: 4 });
  return f;
}

/** Random keys and value for the heap forms. */
function heapRandom(seed: number): Record<string, string> {
  const rnd = mulberry32(seed * 17 + 3);
  const n = 6 + (seed % 5);
  return { keys: Array.from({ length: n }, () => 1 + Math.floor(rnd() * 60)).join(', '), value: String(1 + Math.floor(rnd() * 60)) };
}

/** Builds a heap definition. */
function defineHeap(id: string, name: string, summary: string, pseudocode: string[], keys: string, withValue: boolean, run: (h: Heap, input: FormInput) => void, complexity: AlgorithmDef['complexity']): AlgorithmDef<FormInput, TreeState> {
  return {
    id,
    name,
    family: 'tree',
    group: 'Heaps',
    summary,
    complexity,
    pseudocode,
    theory: theoryFor(id),
    input: { kind: 'form', maxSize: 100, defaultSize: 0, form: heapForm(keys, withValue), randomize: heapRandom },
    view: 'tree',
    scale: {
      sizes: spread(1, MAX_KEYS),
      unit: 'keys',
      shapes: [shape('random', 'Random keys', 3), shape('reversed', 'Descending keys')],
      make: (n, s, seed) => {
        const rnd = mulberry32(seed * 17 + n);
        const keys = s === 'reversed' ? Array.from({ length: n }, (_, i) => 10 * (n - i)) : Array.from({ length: n }, () => 1 + Math.floor(rnd() * 60));
        return { kind: 'min', keys, value: s === 'reversed' ? 1 : 1 + Math.floor(rnd() * 60) };
      },
      sizeOf: (i) => (i.keys as number[]).length,
    },
    run(input): Step<TreeState>[] {
      const h = new Heap([], str(input, 'kind') !== 'max');
      run(h, input);
      return h.rec.steps;
    },
  };
}

/** Builds a heap from keys by repeated insert, silently. */
function seed(h: Heap, keys: number[]): void {
  h.silent = true;
  for (const k of keys) h.insert(k, 0, 0);
  h.silent = false;
}

/** Heap insert. */
export const heapInsert = defineHeap(
  'heap-insert',
  'Heap Insert',
  'Appends the value at the end, then swaps it upward while it beats its parent.',
  ['append the value at the end of the array', 'while the value is better than its parent', '  swap it with its parent'],
  '20, 12, 30, 8, 15, 40',
  true,
  (h, input) => {
    seed(h, nums(input, 'keys'));
    h.snap([], 0, `${h.min ? 'Min' : 'Max'}-heap with ${h.a.length} keys. Insert ${int(input, 'value')}.`);
    h.insert(int(input, 'value'), 0, 1);
  },
  { best: 'O(1)', average: 'O(1)', worst: 'O(log n)', space: 'O(1)' },
);

/** Heap extract. */
export const heapExtract = defineHeap(
  'heap-extract',
  'Heap Extract Root',
  'Removes the top element, moves the last element to the top, and sifts it down.',
  ['take the root (the smallest or largest value)', 'move the last element to the root', 'while it is worse than a child', '  swap it with the better child'],
  '20, 12, 30, 8, 15, 40, 25',
  false,
  (h, input) => {
    seed(h, nums(input, 'keys'));
    if (!h.a.length) return h.snap([], 0, 'The heap is empty: there is nothing to extract.');
    h.snap([{ kind: 'found', index: 0 }], 0, `The root ${h.a[0]} is the ${h.min ? 'smallest' : 'largest'} value.`);
    const top = h.a[0];
    const last = h.a.pop() as number;
    if (h.a.length === 0) return h.snap([], 0, `${top} was the only element: the heap is now empty.`);
    h.a[0] = last;
    h.snap([{ kind: 'swap', index: 0 }], 1, `Remove ${top}; move the last element ${last} to the root.`);
    h.siftDown(0, h.a.length, 3);
    h.snap([], 3, `Extracted ${top}. The heap property is restored.`);
  },
  { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
);

/** Build heap (heapify). */
export const heapBuild = defineHeap(
  'heap-build',
  'Build Heap (Heapify)',
  'Turns an unordered array into a heap in O(n) by sifting down every parent, from the last parent up to the root.',
  ['for i from n/2 - 1 down to 0', '  sift a[i] down:', '    find the best of a[i] and its children', '    swap with it and keep going down'],
  '40, 15, 8, 30, 12, 20, 4',
  false,
  (h, input) => {
    h.a = [...nums(input, 'keys')];
    h.silent = false;
    h.snap([], 0, `The array is not yet a ${h.min ? 'min' : 'max'}-heap. Sift down every parent, starting from the last one.`);
    for (let i = (h.a.length >> 1) - 1; i >= 0; i--) {
      h.snap([{ kind: 'pivot', index: i }], 1, `Sift down index ${i} (${h.a[i]}).`);
      h.siftDown(i, h.a.length, 2);
    }
    h.snap([], 0, 'Done: every parent is better than its children, so the array is a heap.');
  },
  { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
);
