import { InputError, int, nums, str } from '../../core/forms';
import { shape, spread } from '../../core/scale';
import { mulberry32 } from '../../core/random';
import { Table, cellMark } from '../../core/table';
import { defineForm } from '../define';

/** Random small arrays for the forms. */
const rnd = (seed: number) => mulberry32(seed * 977 + 13);

/** 0/1 knapsack. */
export const knapsack = defineForm({
  id: 'knapsack-01',
  name: '0/1 Knapsack',
  family: 'dp',
  group: 'Classic DP',
  summary: 'Chooses items to maximize value within a weight limit. Cell (i, w) is the best value using the first i items with capacity w.',
  complexity: { best: 'O(n·W)', average: 'O(n·W)', worst: 'O(n·W)', space: 'O(n·W)' },
  pseudocode: ['best[0][w] = 0 for every capacity w', 'for each item i and capacity w', '  skip = best[i-1][w]', '  take = value[i] + best[i-1][w - weight[i]]  (if it fits)', '  best[i][w] = max(skip, take)', 'trace back to find which items were taken'],
  form: [
    { key: 'weights', label: 'Weights', type: 'numbers', default: '2, 3, 4, 5', max: 6 },
    { key: 'values', label: 'Values', type: 'numbers', default: '3, 4, 5, 6', max: 6 },
    { key: 'cap', label: 'Capacity', type: 'int', default: 8, min: 1, max: 14 },
  ],
  randomize: (seed) => {
    const r = rnd(seed);
    const n = 4 + (seed % 2);
    return { weights: Array.from({ length: n }, () => 1 + Math.floor(r() * 6)).join(', '), values: Array.from({ length: n }, () => 1 + Math.floor(r() * 9)).join(', '), cap: String(7 + (seed % 5)) };
  },
  scale: { sizes: spread(1, 6, 6), unit: 'items', shapes: [shape('random', 'Random items, capacity 10', 3)], make: (n, _s, seed) => { const r = rnd(seed + n); return { weights: Array.from({ length: n }, () => 1 + Math.floor(r() * 6)), values: Array.from({ length: n }, () => 1 + Math.floor(r() * 9)), cap: 10 }; }, sizeOf: (i) => nums(i, 'weights').length },
  view: 'cells',
  run(input) {
    const w = nums(input, 'weights');
    const v = nums(input, 'values');
    const cap = int(input, 'cap');
    if (w.length !== v.length) throw new InputError(`Give one value per weight (${w.length} weights, ${v.length} values).`);
    if (w.some((x) => x < 1)) throw new InputError('Weights must be positive.');
    const n = w.length;
    const t = new Table(n + 1, cap + 1, ['cells filled'], ['none', ...w.map((x, i) => `item ${i + 1} (w${x}, v${v[i]})`)], Array.from({ length: cap + 1 }, (_, i) => String(i)));
    t.rec.alloc((n + 1) * (cap + 1));
    t.snap([], 0, 'Row 0 (no items) is 0 for every capacity.');
    for (let c = 0; c <= cap; c++) t.set(0, c, 0);
    for (let i = 1; i <= n; i++) {
      for (let c = 0; c <= cap; c++) {
        const skip = t.get(i - 1, c) as number;
        const fits = w[i - 1] <= c;
        const take = fits ? v[i - 1] + (t.get(i - 1, c - w[i - 1]) as number) : -Infinity;
        const best = Math.max(skip, take);
        t.set(i, c, best);
        t.rec.count('cells filled');
        const marks = [cellMark(t, 'compare', i - 1, c), ...(fits ? [cellMark(t, 'compare', i - 1, c - w[i - 1])] : []), cellMark(t, 'insert', i, c)];
        t.snap(marks, 4, fits ? `Item ${i} (weight ${w[i - 1]}, value ${v[i - 1]}) fits in ${c}: skip = ${skip}, take = ${v[i - 1]} + ${t.get(i - 1, c - w[i - 1])} = ${take}. Keep ${best}.` : `Item ${i} (weight ${w[i - 1]}) does not fit in capacity ${c}: keep ${skip}.`);
      }
    }
    // Trace back from the bottom-right corner.
    const chosen: number[] = [];
    const path: number[] = [];
    let c = cap;
    for (let i = n; i >= 1; i--) {
      path.push(t.at(i, c));
      if (t.get(i, c) !== t.get(i - 1, c)) {
        chosen.push(i);
        c -= w[i - 1];
      }
    }
    t.snap([...path.map((index) => ({ kind: 'path' as const, index })), cellMark(t, 'found', n, cap)], 5, `Best value ${t.get(n, cap)}. Items taken: ${chosen.length ? chosen.reverse().join(', ') : 'none'}.`);
    return t.steps;
  },
});

/** Longest common subsequence. */
export const lcs = defineForm({
  id: 'lcs',
  name: 'Longest Common Subsequence',
  family: 'dp',
  group: 'Sequences',
  summary: 'Cell (i, j) is the LCS length of the first i letters of A and the first j letters of B.',
  complexity: { best: 'O(m·n)', average: 'O(m·n)', worst: 'O(m·n)', space: 'O(m·n)' },
  pseudocode: ['table[i][0] = table[0][j] = 0', 'for each i, j', '  if A[i] == B[j]: table[i][j] = table[i-1][j-1] + 1', '  else: table[i][j] = max(table[i-1][j], table[i][j-1])', 'trace back from the corner to read off the subsequence'],
  form: [
    { key: 'a', label: 'String A', type: 'text', default: 'ABCBDAB', maxLength: 10 },
    { key: 'b', label: 'String B', type: 'text', default: 'BDCABA', maxLength: 10 },
  ],
  randomize: (seed) => {
    const r = rnd(seed);
    const word = (n: number) => Array.from({ length: n }, () => 'ABCD'[Math.floor(r() * 4)]).join('');
    return { a: word(6 + (seed % 3)), b: word(6 + ((seed + 1) % 3)) };
  },
  scale: { sizes: spread(1, 10), unit: 'letters', shapes: [shape('random', 'Random strings of equal length', 3)], make: (n, _s, seed) => { const r = rnd(seed + n); const w = () => Array.from({ length: n }, () => 'ABCD'[Math.floor(r() * 4)]).join(''); return { a: w(), b: w() }; }, sizeOf: (i) => str(i, 'a').length },
  view: 'cells',
  run(input) {
    const a = str(input, 'a');
    const b = str(input, 'b');
    const t = new Table(a.length + 1, b.length + 1, ['cells filled'], ['', ...a], ['', ...b]);
    for (let i = 0; i <= a.length; i++) t.set(i, 0, 0);
    for (let j = 0; j <= b.length; j++) t.set(0, j, 0);
    t.rec.alloc((a.length + 1) * (b.length + 1));
    t.snap([], 0, 'The first row and column are 0: an empty string has nothing in common.');
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) {
        const eq = a[i - 1] === b[j - 1];
        const v = eq ? (t.get(i - 1, j - 1) as number) + 1 : Math.max(t.get(i - 1, j) as number, t.get(i, j - 1) as number);
        t.set(i, j, v);
        t.rec.count('cells filled');
        t.snap(eq ? [cellMark(t, 'compare', i - 1, j - 1), cellMark(t, 'insert', i, j)] : [cellMark(t, 'compare', i - 1, j), cellMark(t, 'compare', i, j - 1), cellMark(t, 'insert', i, j)], eq ? 2 : 3, eq ? `"${a[i - 1]}" = "${b[j - 1]}": diagonal + 1 = ${v}.` : `"${a[i - 1]}" != "${b[j - 1]}": max(above, left) = ${v}.`);
      }
    let i = a.length;
    let j = b.length;
    let out = '';
    const path: number[] = [t.at(i, j)];
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        out = a[i - 1] + out;
        i--;
        j--;
      } else if ((t.get(i - 1, j) as number) >= (t.get(i, j - 1) as number)) i--;
      else j--;
      path.push(t.at(i, j));
    }
    t.snap(path.map((index) => ({ kind: 'path' as const, index })), 4, `The longest common subsequence has length ${t.get(a.length, b.length)}: "${out}".`);
    return t.steps;
  },
});

/** Edit distance (Levenshtein). */
export const editDistance = defineForm({
  id: 'edit-distance',
  name: 'Edit Distance',
  family: 'dp',
  group: 'Sequences',
  summary: 'The fewest inserts, deletes, and substitutions that turn A into B. Cell (i, j) is the distance between the first i and j letters.',
  complexity: { best: 'O(m·n)', average: 'O(m·n)', worst: 'O(m·n)', space: 'O(m·n)' },
  pseudocode: ['table[i][0] = i; table[0][j] = j', 'for each i, j', '  if A[i] == B[j]: table[i][j] = table[i-1][j-1]', '  else: 1 + min(delete: table[i-1][j], insert: table[i][j-1], replace: table[i-1][j-1])'],
  form: [
    { key: 'a', label: 'From', type: 'text', default: 'kitten', maxLength: 10 },
    { key: 'b', label: 'To', type: 'text', default: 'sitting', maxLength: 10 },
  ],
  randomize: (seed) => {
    const pairs = [['kitten', 'sitting'], ['sunday', 'saturday'], ['horse', 'ros'], ['intention', 'execution'], ['flaw', 'lawn']];
    const [a, b] = pairs[seed % pairs.length];
    return { a, b };
  },
  scale: { sizes: spread(1, 10), unit: 'letters', shapes: [shape('random', 'Random strings of equal length', 3)], make: (n, _s, seed) => { const r = rnd(seed + n); const w = () => Array.from({ length: n }, () => 'abcd'[Math.floor(r() * 4)]).join(''); return { a: w(), b: w() }; }, sizeOf: (i) => str(i, 'a').length },
  view: 'cells',
  run(input) {
    const a = str(input, 'a');
    const b = str(input, 'b');
    const t = new Table(a.length + 1, b.length + 1, ['cells filled'], ['', ...a], ['', ...b]);
    for (let i = 0; i <= a.length; i++) t.set(i, 0, i);
    for (let j = 0; j <= b.length; j++) t.set(0, j, j);
    t.rec.alloc((a.length + 1) * (b.length + 1));
    t.snap([], 0, 'Turning a prefix into an empty string takes one delete per letter; building one from empty takes one insert per letter.');
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) {
        const eq = a[i - 1] === b[j - 1];
        const del = (t.get(i - 1, j) as number) + 1;
        const ins = (t.get(i, j - 1) as number) + 1;
        const rep = (t.get(i - 1, j - 1) as number) + (eq ? 0 : 1);
        const v = Math.min(del, ins, rep);
        t.set(i, j, v);
        t.rec.count('cells filled');
        t.snap([cellMark(t, 'compare', i - 1, j), cellMark(t, 'compare', i, j - 1), cellMark(t, 'compare', i - 1, j - 1), cellMark(t, 'insert', i, j)], eq ? 2 : 3, eq ? `"${a[i - 1]}" = "${b[j - 1]}": no edit needed, copy the diagonal (${v}).` : `"${a[i - 1]}" != "${b[j - 1]}": 1 + min(delete ${del - 1}, insert ${ins - 1}, replace ${rep - 1}) = ${v}.`);
      }
    let i = a.length;
    let j = b.length;
    const path = [t.at(i, j)];
    while (i > 0 || j > 0) {
      const cur = t.get(i, j) as number;
      if (i > 0 && j > 0 && cur === (t.get(i - 1, j - 1) as number) + (a[i - 1] === b[j - 1] ? 0 : 1)) (i--, j--);
      else if (i > 0 && cur === (t.get(i - 1, j) as number) + 1) i--;
      else j--;
      path.push(t.at(i, j));
    }
    t.snap(path.map((index) => ({ kind: 'path' as const, index })), 3, `Edit distance from "${a}" to "${b}" is ${t.get(a.length, b.length)}.`);
    return t.steps;
  },
});

/** Longest increasing subsequence. */
export const lis = defineForm({
  id: 'lis',
  name: 'Longest Increasing Subsequence',
  family: 'dp',
  group: 'Sequences',
  summary: 'dp[i] is the length of the longest increasing subsequence that ends at position i.',
  complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(n)' },
  pseudocode: ['dp[i] = 1 for every i', 'for each i', '  for each j < i', '    if a[j] < a[i] and dp[j] + 1 > dp[i]: dp[i] = dp[j] + 1; prev[i] = j', 'the answer is the largest dp[i]; follow prev to list it'],
  form: [{ key: 'a', label: 'Numbers', type: 'numbers', default: '10, 22, 9, 33, 21, 50, 41, 60', max: 12 }],
  randomize: (seed) => ({ a: Array.from({ length: 9 }, (_, i) => 1 + ((seed * 31 + i * 17) % 40)).join(', ') }),
  scale: { sizes: spread(1, 12), unit: 'elements', shapes: [shape('random', 'Random numbers', 3)], make: (n, _s, seed) => { const r = rnd(seed + n); return { a: Array.from({ length: n }, () => 1 + Math.floor(r() * 40)) }; }, sizeOf: (i) => nums(i, 'a').length },
  view: 'cells',
  run(input) {
    const a = nums(input, 'a');
    if (!a.length) throw new InputError('Enter at least one number.');
    const n = a.length;
    const t = new Table(3, n, ['comparisons'], ['value', 'dp (length ending here)', 'previous'], a.map((_, i) => String(i)));
    a.forEach((x, i) => (t.set(0, i, x), t.set(1, i, 1), t.set(2, i, '-')));
    t.rec.alloc(2 * n);
    t.snap([], 0, 'Every element alone is an increasing subsequence of length 1.');
    const prev = Array(n).fill(-1);
    for (let i = 1; i < n; i++)
      for (let j = 0; j < i; j++) {
        t.rec.count('comparisons');
        const better = a[j] < a[i] && (t.get(1, j) as number) + 1 > (t.get(1, i) as number);
        if (better) {
          t.set(1, i, (t.get(1, j) as number) + 1);
          t.set(2, i, j);
          prev[i] = j;
        }
        t.snap([cellMark(t, 'compare', 0, j), cellMark(t, 'active', 0, i), ...(better ? [cellMark(t, 'insert', 1, i)] : [])], 3, better ? `${a[j]} < ${a[i]}: extend the run ending at ${j}. dp[${i}] = ${t.get(1, i)}.` : a[j] < a[i] ? `${a[j]} < ${a[i]}, but it would not beat dp[${i}] = ${t.get(1, i)}.` : `${a[j]} is not smaller than ${a[i]}: cannot extend.`);
      }
    let end = 0;
    for (let i = 0; i < n; i++) if ((t.get(1, i) as number) > (t.get(1, end) as number)) end = i;
    const seq: number[] = [];
    for (let k = end; k !== -1; k = prev[k]) seq.unshift(k);
    t.snap(seq.map((i) => cellMark(t, 'path', 0, i)), 4, `The longest increasing subsequence has length ${seq.length}: ${seq.map((i) => a[i]).join(', ')}.`);
    return t.steps;
  },
});

/** Coin change: fewest coins. */
export const coinChange = defineForm({
  id: 'coin-change',
  name: 'Coin Change (Fewest Coins)',
  family: 'dp',
  group: 'Classic DP',
  summary: 'dp[a] is the fewest coins that make amount a. Try every coin as the last coin and take the best.',
  complexity: { best: 'O(n·A)', average: 'O(n·A)', worst: 'O(n·A)', space: 'O(A)' },
  pseudocode: ['dp[0] = 0; every other dp = infinity', 'for amount a from 1 to A', '  for each coin c <= a', '    dp[a] = min(dp[a], dp[a - c] + 1)', 'dp[A] is the answer'],
  form: [
    { key: 'coins', label: 'Coins', type: 'numbers', default: '1, 5, 6', max: 5 },
    { key: 'amount', label: 'Amount', type: 'int', default: 11, min: 1, max: 24 },
  ],
  randomize: (seed) => ({ coins: [[1, 5, 6], [1, 3, 4], [2, 5, 10], [1, 7, 10]][seed % 4].join(', '), amount: String(10 + (seed % 12)) }),
  scale: { sizes: spread(1, 24), unit: 'amount', shapes: [shape('coins', 'Coins 1, 5, 6')], make: (n) => ({ coins: [1, 5, 6], amount: n }), sizeOf: (i) => int(i, 'amount') },
  view: 'cells',
  run(input) {
    const coins = nums(input, 'coins');
    const A = int(input, 'amount');
    if (!coins.length || coins.some((c) => c < 1)) throw new InputError('Enter at least one positive coin value.');
    const t = new Table(1, A + 1, ['cells filled'], ['fewest coins'], Array.from({ length: A + 1 }, (_, i) => String(i)));
    t.set(0, 0, 0);
    for (let a = 1; a <= A; a++) t.set(0, a, '∞');
    t.rec.alloc(2 * (A + 1));
    t.snap([cellMark(t, 'insert', 0, 0)], 0, 'Zero coins make amount 0. Every other amount starts at infinity.');
    const last = Array(A + 1).fill(0);
    for (let a = 1; a <= A; a++) {
      for (const c of coins) {
        if (c > a) continue;
        const via = t.get(0, a - c);
        const cand = via === '∞' ? Infinity : (via as number) + 1;
        const cur = t.get(0, a) === '∞' ? Infinity : (t.get(0, a) as number);
        if (cand < cur) (t.set(0, a, cand), (last[a] = c));
        t.snap([cellMark(t, 'compare', 0, a - c), cellMark(t, cand < cur ? 'insert' : 'active', 0, a)], 3, `Amount ${a}, last coin ${c}: dp[${a - c}] + 1 = ${cand === Infinity ? '∞' : cand}${cand < cur ? ', an improvement.' : `, no better than ${cur === Infinity ? '∞' : cur}.`}`);
      }
      t.rec.count('cells filled');
    }
    const best = t.get(0, A);
    if (best === '∞') t.snap([], 4, `Amount ${A} cannot be made with these coins.`);
    else {
      const used: number[] = [];
      const path: number[] = [];
      for (let a = A; a > 0; a -= last[a]) (used.push(last[a]), path.push(t.at(0, a)));
      t.snap(path.map((index) => ({ kind: 'path' as const, index })), 4, `${A} needs ${best} coin${best === 1 ? '' : 's'}: ${used.join(' + ')}.`);
    }
    return t.steps;
  },
});

/** Matrix chain multiplication. */
export const matrixChain = defineForm({
  id: 'matrix-chain',
  name: 'Matrix Chain Multiplication',
  family: 'dp',
  group: 'Classic DP',
  summary: 'Finds the cheapest order to multiply a chain of matrices. Cell (i, j) is the best cost for matrices i through j.',
  complexity: { best: 'O(n³)', average: 'O(n³)', worst: 'O(n³)', space: 'O(n²)' },
  pseudocode: ['cost[i][i] = 0', 'for chain length L from 2 to n', '  for each start i (end j = i + L - 1)', '    for each split k between i and j', '      cost[i][j] = min(cost[i][k] + cost[k+1][j] + d[i-1]·d[k]·d[j])', 'cost[1][n] is the answer'],
  form: [{ key: 'dims', label: 'Dimensions', type: 'numbers', default: '10, 30, 5, 60', max: 7, help: 'Matrix i is dims[i-1] by dims[i]. Four numbers make three matrices.' }],
  randomize: (seed) => ({ dims: [[10, 30, 5, 60], [40, 20, 30, 10, 30], [5, 10, 3, 12, 5, 50], [30, 35, 15, 5, 10, 20]][seed % 4].join(', ') }),
  scale: { sizes: spread(2, 6, 5), unit: 'matrices', shapes: [shape('random', 'Random dimensions', 3)], make: (n, _s, seed) => { const r = rnd(seed + n); return { dims: Array.from({ length: n + 1 }, () => 5 + Math.floor(r() * 36)) }; }, sizeOf: (i) => nums(i, 'dims').length - 1 },
  view: 'cells',
  run(input) {
    const d = nums(input, 'dims');
    if (d.length < 3 || d.some((x) => x < 1)) throw new InputError('Enter at least three positive dimensions (two matrices).');
    const n = d.length - 1;
    const label = Array.from({ length: n }, (_, i) => `M${i + 1}`);
    const t = new Table(n, n, ['splits tried'], label, label);
    const split: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    t.rec.alloc(2 * n * n);
    for (let i = 0; i < n; i++) t.set(i, i, 0);
    t.snap([], 0, `${n} matrices: ${label.map((m, i) => `${m} is ${d[i]}x${d[i + 1]}`).join(', ')}. A single matrix costs 0.`);
    for (let L = 2; L <= n; L++)
      for (let i = 0; i + L - 1 < n; i++) {
        const j = i + L - 1;
        let best = Infinity;
        for (let k = i; k < j; k++) {
          const cost = (t.get(i, k) as number) + (t.get(k + 1, j) as number) + d[i] * d[k + 1] * d[j + 1];
          t.rec.count('splits tried');
          if (cost < best) (best = cost, (split[i][j] = k));
          t.snap([cellMark(t, 'compare', i, k), cellMark(t, 'compare', k + 1, j), cellMark(t, 'active', i, j)], 4, `${label[i]}..${label[j]}, split after ${label[k]}: ${t.get(i, k)} + ${t.get(k + 1, j)} + ${d[i]}·${d[k + 1]}·${d[j + 1]} = ${cost}${cost <= best ? ' (best so far)' : ''}.`);
        }
        t.set(i, j, best);
        t.snap([cellMark(t, 'insert', i, j)], 4, `Cheapest way to multiply ${label[i]}..${label[j]} costs ${best}.`);
      }
    /** Builds the parenthesization string for matrices i..j. */
    const paren = (i: number, j: number): string => (i === j ? label[i] : `(${paren(i, split[i][j])} x ${paren(split[i][j] + 1, j)})`);
    t.snap([cellMark(t, 'found', 0, n - 1)], 5, `Cheapest order: ${paren(0, n - 1)} with ${t.get(0, n - 1)} scalar multiplications.`);
    return t.steps;
  },
});
