import { int } from '../../core/forms';
import { shape, spread } from '../../core/scale';
import { Table, cellMark } from '../../core/table';
import { defineForm } from '../define';

/** Form: which Fibonacci number to compute. */
const FORM = [{ key: 'n', label: 'n (compute F(n))', type: 'int' as const, default: 9, min: 1, max: 20 }];
/** Random n. */
const randomize = (seed: number) => ({ n: String(5 + (seed % 12)) });

/** Fibonacci by memoization: recursion that remembers answers. */
export const fibMemo = defineForm({
  id: 'fibonacci-memo',
  name: 'Fibonacci (Memoization)',
  family: 'dp',
  group: 'Classic DP',
  summary: 'Recursion that stores every answer the first time it is computed, so each F(k) is calculated only once.',
  complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
  pseudocode: ['fib(k):', '  if memo[k] exists: return it', '  if k <= 1: return k', '  memo[k] = fib(k-1) + fib(k-2)', '  return memo[k]'],
  form: FORM,
  randomize,
  scale: { sizes: spread(1, 20), unit: 'n', shapes: [shape('n', 'F(n)')], make: (n) => ({ n }), sizeOf: (i) => Number(i.n) },
  view: 'cells',
  run(input) {
    const n = int(input, 'n');
    const t = new Table(1, n + 1, ['calls', 'cache hits'], ['F(k)'], Array.from({ length: n + 1 }, (_, i) => String(i)));
    t.rec.alloc(n + 1);
    t.snap([], 0, `Compute F(${n}). The cache starts empty.`);
    /** Memoized recursive Fibonacci. */
    const fib = (k: number): number => {
      t.rec.count('calls');
      t.rec.enter();
      const out = fibBody(k);
      t.rec.leave();
      return out;
    };
    /** Body of one memoized call. */
    const fibBody = (k: number): number => {
      const cached = t.get(0, k);
      if (cached !== null) {
        t.rec.count('cache hits');
        t.snap([cellMark(t, 'found', 0, k)], 1, `F(${k}) is already cached: ${cached}. No work needed.`);
        return cached as number;
      }
      t.snap([cellMark(t, 'active', 0, k)], 0, `Call fib(${k}): not cached yet.`);
      const v = k <= 1 ? k : fib(k - 1) + fib(k - 2);
      t.set(0, k, v);
      t.snap([cellMark(t, 'insert', 0, k)], k <= 1 ? 2 : 3, k <= 1 ? `Base case: F(${k}) = ${k}.` : `F(${k}) = F(${k - 1}) + F(${k - 2}) = ${v}. Cache it.`);
      return v;
    };
    const v = fib(n);
    t.snap([cellMark(t, 'found', 0, n)], 4, `F(${n}) = ${v}.`);
    return t.steps;
  },
});

/** Fibonacci by tabulation: fill a table left to right. */
export const fibTab = defineForm({
  id: 'fibonacci-tabulation',
  name: 'Fibonacci (Tabulation)',
  family: 'dp',
  group: 'Classic DP',
  summary: 'Fills a table from the smallest subproblem up: each cell is the sum of the two before it.',
  complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' },
  pseudocode: ['table[0] = 0; table[1] = 1', 'for k from 2 to n', '  table[k] = table[k-1] + table[k-2]', 'return table[n]'],
  form: FORM,
  randomize,
  scale: { sizes: spread(1, 20), unit: 'n', shapes: [shape('n', 'F(n)')], make: (n) => ({ n }), sizeOf: (i) => Number(i.n) },
  view: 'cells',
  run(input) {
    const n = int(input, 'n');
    const t = new Table(1, n + 1, ['cells filled'], ['F(k)'], Array.from({ length: n + 1 }, (_, i) => String(i)));
    t.rec.alloc(n + 1);
    t.snap([], 0, `Fill a table for F(0) to F(${n}).`);
    t.set(0, 0, 0);
    t.rec.count('cells filled');
    if (n >= 1) (t.set(0, 1, 1), t.rec.count('cells filled'));
    t.snap([cellMark(t, 'insert', 0, 0), ...(n >= 1 ? [cellMark(t, 'insert', 0, 1)] : [])], 0, 'The two base cases: F(0) = 0 and F(1) = 1.');
    for (let k = 2; k <= n; k++) {
      const v = (t.get(0, k - 1) as number) + (t.get(0, k - 2) as number);
      t.set(0, k, v);
      t.rec.count('cells filled');
      t.snap([cellMark(t, 'compare', 0, k - 1), cellMark(t, 'compare', 0, k - 2), cellMark(t, 'insert', 0, k)], 2, `F(${k}) = ${t.get(0, k - 1)} + ${t.get(0, k - 2)} = ${v}.`);
    }
    t.snap([cellMark(t, 'found', 0, n)], 3, `F(${n}) = ${t.get(0, n)}.`);
    return t.steps;
  },
});
