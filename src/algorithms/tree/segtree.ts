import { int, nums } from '../../core/forms';
import { InputError } from '../../core/forms';
import type { AlgorithmDef, FieldSpec, FormInput, Mark, Step, TreeNode, TreeState } from '../../core/step';
import { Rec } from '../../core/tracer';
import { theoryFor } from '../theory';
import { shape, spread } from '../../core/scale';

/** Largest array the segment tree forms accept (keeps the drawing readable). */
const MAX_LEN = 12;

/** A sum segment tree, heap-indexed from 1. */
class Seg {
  readonly sum: Array<number | null>;
  readonly lo: number[];
  readonly hi: number[];
  readonly n: number;
  readonly rec = new Rec<TreeState>(['nodes touched']);

  /** @param a - the array being summarized */
  constructor(readonly a: number[]) {
    this.n = a.length;
    this.sum = Array(4 * this.n).fill(null);
    this.lo = Array(4 * this.n).fill(0);
    this.hi = Array(4 * this.n).fill(0);
    this.ranges(1, 0, this.n - 1);
  }

  /** Records each node's range. */
  private ranges(i: number, l: number, r: number): void {
    this.lo[i] = l;
    this.hi[i] = r;
    if (l === r) return;
    const m = (l + r) >> 1;
    this.ranges(2 * i, l, m);
    this.ranges(2 * i + 1, m + 1, r);
  }

  /** Draws every node computed so far. Uncomputed nodes are left out. */
  state(): TreeState {
    const nodes: Record<number, TreeNode> = {};
    const roots: number[] = [];
    const has = (i: number) => i < this.sum.length && this.sum[i] !== null;
    for (let i = 1; i < this.sum.length; i++) {
      if (!has(i)) continue;
      const leaf = this.lo[i] === this.hi[i];
      nodes[i] = { label: String(this.sum[i]), children: leaf ? [] : [has(2 * i) ? 2 * i : null, has(2 * i + 1) ? 2 * i + 1 : null], sub: leaf ? `[${this.lo[i]}]` : `[${this.lo[i]}..${this.hi[i]}]` };
      if (i === 1 || !has(i >> 1)) roots.push(i);
    }
    return { nodes, roots, binary: true, array: [...this.a], arrayLabel: 'Array' };
  }

  /** Records a frame. */
  snap(marks: Mark[], line: number | null, explain: string): void {
    this.rec.snap(this.state(), marks, line, explain);
  }

  /** Builds the tree bottom-up, one node per frame. When `record` is false it is silent. */
  build(i: number, record: boolean, line: number): void {
    if (record) this.rec.enter();
    const l = this.lo[i];
    const r = this.hi[i];
    if (l === r) {
      this.sum[i] = this.a[l];
      if (record) this.snap([{ kind: 'insert', index: i }], line, `Leaf for index ${l}: value ${this.a[l]}.`);
      if (record) this.rec.leave();
      return;
    }
    this.build(2 * i, record, line);
    this.build(2 * i + 1, record, line);
    this.sum[i] = (this.sum[2 * i] as number) + (this.sum[2 * i + 1] as number);
    if (record) this.snap([{ kind: 'insert', index: i }, { kind: 'compare', index: 2 * i }, { kind: 'compare', index: 2 * i + 1 }], line, `Node [${l}..${r}] = ${this.sum[2 * i]} + ${this.sum[2 * i + 1]} = ${this.sum[i]}.`);
    if (record) this.rec.leave();
  }
}

/** Form for the segment tree algorithms. */
function segForm(extra: FieldSpec[]): FieldSpec[] {
  return [{ key: 'array', label: 'Array', type: 'numbers', default: '5, 3, 8, 6, 2, 7, 4, 1', max: MAX_LEN, help: `Up to ${MAX_LEN} numbers.` }, ...extra];
}

/** Random array for the forms. */
function segRandom(seed: number): Record<string, string> {
  const a = Array.from({ length: 8 }, (_, i) => 1 + ((seed * 13 + i * 7) % 9));
  return { array: a.join(', '), from: String(seed % 3), to: String(4 + (seed % 4)), index: String(seed % 8), value: String(1 + (seed % 9)) };
}

/** Builds a segment tree definition. */
function defineSeg(id: string, name: string, summary: string, pseudocode: string[], extra: FieldSpec[], run: (s: Seg, input: FormInput) => void): AlgorithmDef<FormInput, TreeState> {
  return {
    id,
    name,
    family: 'tree',
    group: 'Segment tree',
    summary,
    complexity: id === 'segtree-build' ? { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' } : { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(n)' },
    pseudocode,
    theory: theoryFor(id),
    input: { kind: 'form', maxSize: 100, defaultSize: 0, form: segForm(extra), randomize: segRandom },
    view: 'tree',
    scale: {
      sizes: spread(1, MAX_LEN),
      unit: 'elements',
      shapes: [shape('random', 'Random values')],
      make: (n) => ({ array: Array.from({ length: n }, (_, i) => 1 + ((i * 7) % 9)), from: 0, to: n - 1, index: Math.floor(n / 2), value: 5 }),
      sizeOf: (i) => (i.array as number[]).length,
    },
    run(input): Step<TreeState>[] {
      const a = nums(input, 'array');
      if (a.length === 0) throw new InputError('Enter at least one number.');
      const s = new Seg(a);
      run(s, input);
      return s.rec.steps;
    },
  };
}

/** Segment tree build. */
export const segBuild = defineSeg('segtree-build', 'Segment Tree Build', 'Each node stores the sum of a range; a parent is the sum of its two children.', ['build(node, l, r)', '  if l == r: node = a[l]', '  else build both halves', '  node = left + right'], [], (s) => {
  s.snap([], 0, `Build a sum tree over ${s.n} numbers.`);
  s.build(1, true, 1);
  s.snap([], 3, `Done: the root holds the total, ${s.sum[1]}.`);
});

/** Segment tree range query. */
export const segQuery = defineSeg(
  'segtree-query',
  'Segment Tree Range Sum',
  'Answers a range-sum query by combining O(log n) nodes: fully covered nodes are used whole, partial ones are split.',
  ['query(node, l, r, from, to)', '  if the node range is outside [from, to]: return 0', '  if it is inside: return the stored sum', '  else return query(left) + query(right)'],
  [
    { key: 'from', label: 'From index', type: 'int', default: 2, min: 0, max: 11 },
    { key: 'to', label: 'To index', type: 'int', default: 6, min: 0, max: 11 },
  ],
  (s, input) => {
    const from = int(input, 'from');
    const to = int(input, 'to');
    if (from > to || to >= s.n) throw new InputError(`Use 0 <= from <= to < ${s.n}.`);
    s.build(1, false, 0);
    s.snap([], 0, `Sum of indices ${from}..${to}.`);
    /** Recursive query returning the sum of the overlap. */
    const q = (i: number): number => {
      s.rec.enter();
      const l = s.lo[i];
      const out = qInner(i, l);
      s.rec.leave();
      return out;
    };
    /** Body of one query call. */
    const qInner = (i: number, l: number): number => {
      const r = s.hi[i];
      s.rec.count('nodes touched');
      if (r < from || l > to) {
        s.snap([{ kind: 'notfound', index: i }], 1, `[${l}..${r}] is outside the query: contributes 0.`);
        return 0;
      }
      if (from <= l && r <= to) {
        s.snap([{ kind: 'found', index: i }], 2, `[${l}..${r}] is fully inside the query: use its stored sum ${s.sum[i]}.`);
        return s.sum[i] as number;
      }
      s.snap([{ kind: 'compare', index: i }], 3, `[${l}..${r}] partly overlaps: split into both children.`);
      return q(2 * i) + q(2 * i + 1);
    };
    const total = q(1);
    s.snap([], 3, `Sum of indices ${from}..${to} is ${total}.`);
  },
);

/** Segment tree point update. */
export const segUpdate = defineSeg(
  'segtree-update',
  'Segment Tree Point Update',
  'Changes one array value, then recomputes the sums of its ancestors on the way up to the root.',
  ['find the leaf for the index', 'set the leaf to the new value', 'for each ancestor up to the root', '  recompute it as left + right'],
  [
    { key: 'index', label: 'Index', type: 'int', default: 3, min: 0, max: 11 },
    { key: 'value', label: 'New value', type: 'int', default: 10 },
  ],
  (s, input) => {
    const idx = int(input, 'index');
    const v = int(input, 'value');
    s.rec.raise('memory', 0);
    if (idx >= s.n) throw new InputError(`Index must be between 0 and ${s.n - 1}.`);
    s.build(1, false, 0);
    s.snap([], 0, `Set a[${idx}] = ${v}.`);
    let i = 1;
    while (s.lo[i] !== s.hi[i]) i = idx <= (s.lo[i] + s.hi[i]) >> 1 ? 2 * i : 2 * i + 1;
    s.a[idx] = v;
    s.sum[i] = v;
    s.snap([{ kind: 'swap', index: i }], 1, `Leaf [${idx}] changes to ${v}.`);
    for (i >>= 1; i >= 1; i >>= 1) {
      s.sum[i] = (s.sum[2 * i] as number) + (s.sum[2 * i + 1] as number);
      s.rec.count('nodes touched');
      s.snap([{ kind: 'swap', index: i }], 3, `Recompute [${s.lo[i]}..${s.hi[i]}] = ${s.sum[2 * i]} + ${s.sum[2 * i + 1]} = ${s.sum[i]}.`);
    }
  },
);
