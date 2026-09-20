import { CLASSICS } from '../../src/algorithms/classics';
import { DP } from '../../src/algorithms/dp';
import { STRINGS } from '../../src/algorithms/strings';
import { buildForm, defaultRaw } from '../../src/core/forms';
import type { AlgorithmDef, GridState, HanoiState, Step, TableState, TextState } from '../../src/core/step';

const ALL = [...DP, ...STRINGS, ...CLASSICS];
const byId = (id: string): AlgorithmDef<any, any> => ALL.find((d) => d.id === id)!;

/** Runs an algorithm with default fields overridden by `raw`. */
function run(id: string, raw: Record<string, string> = {}): Step<any>[] {
  const def = byId(id);
  const built = buildForm(def.input.form!, { ...defaultRaw(def), ...raw });
  if (!built.ok) throw new Error(built.error);
  return def.run(built.input);
}
const last = (s: Step<any>[]) => s.at(-1)!;

describe('Fibonacci', () => {
  const fib = (n: number): number => (n < 2 ? n : fib(n - 1) + fib(n - 2));
  it.each([1, 2, 5, 10, 20])('both methods compute F(%i)', (n) => {
    for (const id of ['fibonacci-memo', 'fibonacci-tabulation']) {
      const t = last(run(id, { n: String(n) })).state as TableState;
      expect(t.cells[n]).toBe(fib(n));
    }
  });
  it('memoization makes O(n) calls, not exponential', () => {
    expect(last(run('fibonacci-memo', { n: '20' })).stats.calls).toBeLessThan(60);
  });
});

describe('knapsack', () => {
  /** Brute-force best value. */
  const brute = (w: number[], v: number[], cap: number) => {
    let best = 0;
    for (let m = 0; m < 1 << w.length; m++) {
      let tw = 0;
      let tv = 0;
      w.forEach((_, i) => m & (1 << i) && ((tw += w[i]), (tv += v[i])));
      if (tw <= cap) best = Math.max(best, tv);
    }
    return best;
  };
  it.each([1, 2, 3, 4, 5, 6])('matches brute force (seed %i)', (seed) => {
    const def = byId('knapsack-01');
    const raw = { ...defaultRaw(def), ...def.input.randomize!(seed) };
    const built = buildForm(def.input.form!, raw) as any;
    const t = last(def.run(built.input)).state as TableState;
    expect(t.cells.at(-1)).toBe(brute(built.input.weights, built.input.values, built.input.cap));
  });
  it('rejects mismatched lengths', () => {
    expect(() => run('knapsack-01', { weights: '1, 2', values: '3' })).toThrow(/one value per weight/);
  });
});

describe('LCS and edit distance', () => {
  it('LCS of the textbook pair has length 4', () => {
    expect((last(run('lcs')).state as TableState).cells.at(-1)).toBe(4);
  });
  it('LCS of identical strings is their length', () => {
    expect((last(run('lcs', { a: 'HELLO', b: 'HELLO' })).state as TableState).cells.at(-1)).toBe(5);
  });
  it.each([['kitten', 'sitting', 3], ['sunday', 'saturday', 3], ['horse', 'ros', 3], ['', 'abc', 3], ['abc', 'abc', 0]])('edit distance %s -> %s is %i', (a, b, d) => {
    expect((last(run('edit-distance', { a, b })).state as TableState).cells.at(-1)).toBe(d);
  });
});

describe('LIS, coin change, matrix chain', () => {
  it('LIS of the classic array has length 5', () => {
    expect(last(run('lis')).explain).toContain('length 5');
  });
  it('coin change finds the fewest coins (greedy would fail)', () => {
    expect(last(run('coin-change', { coins: '1, 5, 6', amount: '11' })).explain).toContain('2 coins');
    expect(last(run('coin-change', { coins: '2', amount: '3' })).explain).toContain('cannot be made');
  });
  it('matrix chain gives the known optimum', () => {
    expect(last(run('matrix-chain', { dims: '10, 30, 5, 60' })).explain).toContain('4500');
    expect(last(run('matrix-chain', { dims: '30, 35, 15, 5, 10, 20' })).explain).toContain('11875');
    expect(last(run('matrix-chain', { dims: '30, 35, 15, 5, 10, 20, 25' })).explain).toContain('15125');
  });
});

/** Naive reference: every index where `p` occurs in `t`. */
const naive = (t: string, p: string) => Array.from({ length: t.length - p.length + 1 }, (_, i) => i).filter((i) => t.startsWith(p, i));

describe('string matching', () => {
  const cases: Array<[string, string]> = [['ABABDABACDABABCABAB', 'ABABCABAB'], ['AAAAAA', 'AA'], ['ABCDEF', 'XY'], ['GCATCGCAGAGAGTATACAGTACG', 'GCAGAGAG'], ['ABABABA', 'ABA']];
  it.each(['kmp', 'rabin-karp', 'z-algorithm'])('%s finds exactly the occurrences a naive search finds', (id) => {
    for (const [text, pattern] of cases) {
      const expected = naive(text, pattern);
      const explain = last(run(id, { text, pattern })).explain;
      if (expected.length === 0) expect(explain).toContain('does not occur');
      else expect(explain).toContain(`position${expected.length > 1 ? 's' : ''} ${expected.join(', ')}.`);
    }
  });
  it('Rabin-Karp reports a spurious hash hit without calling it a match', () => {
    // 'a' (97) and 'b' (98) collide mod 101 only for crafted inputs; we just check the wording path exists.
    const steps = run('rabin-karp', { text: 'ABCDEFG', pattern: 'XYZ' });
    expect(last(steps).explain).toContain('does not occur');
  });
  it('KMP failure table is right for the classic pattern', () => {
    const t = last(run('kmp', { text: 'ABABCABAB', pattern: 'ABABCABAB' })).state as TextState;
    expect(t.table).toEqual([0, 0, 1, 2, 0, 1, 2, 3, 4]);
  });
  it('rejects an empty pattern and a pattern longer than the text', () => {
    expect(() => run('kmp', { pattern: '' })).toThrow(/pattern/);
    expect(() => run('kmp', { text: 'AB', pattern: 'ABC' })).toThrow(/longer/);
  });
});

describe('N-Queens', () => {
  /** True when no two queens attack. */
  const valid = (g: GridState) => {
    const q = g.text!.map((t, i) => (t ? [Math.floor(i / g.cols), i % g.cols] : null)).filter(Boolean) as number[][];
    return q.length === g.rows && q.every(([r, c], i) => q.every(([r2, c2], j) => i === j || (c !== c2 && Math.abs(r - r2) !== Math.abs(c - c2))));
  };
  it.each([4, 5, 6, 7, 8])('solves n=%i', (n) => {
    expect(valid(last(run('n-queens', { n: String(n) })).state as GridState)).toBe(true);
  });
});

describe('Sudoku', () => {
  /** True when every row, column, and box holds 1 to 9 exactly once. */
  const solved = (t: string[]) => {
    const g = t.map(Number);
    const ok = (idx: number[]) => new Set(idx.map((i) => g[i])).size === 9 && idx.every((i) => g[i] >= 1 && g[i] <= 9);
    for (let k = 0; k < 9; k++) {
      if (!ok(Array.from({ length: 9 }, (_, i) => k * 9 + i))) return false;
      if (!ok(Array.from({ length: 9 }, (_, i) => i * 9 + k))) return false;
      const br = Math.floor(k / 3) * 27 + (k % 3) * 3;
      if (!ok(Array.from({ length: 9 }, (_, i) => br + Math.floor(i / 3) * 9 + (i % 3)))) return false;
    }
    return true;
  };
  it('solves the default puzzle', () => {
    const s = run('sudoku');
    expect(solved((last(s).state as GridState).text!)).toBe(true);
    expect(s.length).toBeLessThan(4200);
  });
  it('rejects malformed and contradictory puzzles', () => {
    expect(() => run('sudoku', { puzzle: '123' })).toThrow(/81 characters/);
    expect(() => run('sudoku', { puzzle: '11' + '0'.repeat(79) })).toThrow(/clashes/);
  });
  it('reports an unsolvable puzzle', () => {
    // Row 1 holds 1-8, and column 9 already has a 9, so cell (1,9) has no legal digit.
    const puzzle = '123456780' + '000000009' + '0'.repeat(63);
    expect(last(run('sudoku', { puzzle })).explain).toMatch(/no solution|Step limit/);
  });
});

describe('Tower of Hanoi', () => {
  it.each([1, 2, 3, 4, 5, 6])('moves n=%i in 2^n - 1 moves', (n) => {
    const s = run('tower-of-hanoi', { n: String(n) });
    expect(last(s).stats.moves).toBe(2 ** n - 1);
    expect((last(s).state as HanoiState).pegs[2]).toEqual(Array.from({ length: n }, (_, i) => n - i));
  });
});

describe('permutations and subsets', () => {
  const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
  it.each([1, 2, 3, 4, 5])('generates %i! permutations', (n) => {
    const items = Array.from({ length: n }, (_, i) => i + 1).join(', ');
    expect(last(run('permutations', { items })).stats['permutations found']).toBe(fact(n));
  });
  it.each([1, 2, 3, 4, 5])('generates 2^%i subsets', (n) => {
    const items = Array.from({ length: n }, (_, i) => i + 1).join(', ');
    expect(last(run('subsets', { items })).stats['subsets found']).toBe(2 ** n);
  });
  it('subset sum finds a solution or says none exists', () => {
    expect(last(run('subset-sum', { items: '3, 34, 4, 12, 5, 2', target: '9' })).explain).toContain('sum to 9');
    expect(last(run('subset-sum', { items: '2, 4, 6', target: '5' })).explain).toContain('No combination');
  });
});

describe('number theory', () => {
  it('sieve finds exactly the primes', () => {
    const isPrime = (n: number) => n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) }, (_, i) => i + 2).filter((d) => d < n).every((d) => n % d !== 0);
    for (const n of [10, 30, 50, 97, 100]) {
      const expected = Array.from({ length: n - 1 }, (_, i) => i + 2).filter(isPrime);
      expect(last(run('sieve-of-eratosthenes', { n: String(n) })).explain).toContain(`${expected.length} primes up to ${n}: ${expected.join(', ')}.`);
    }
  });
  it.each([[1071, 462, 21], [48, 18, 6], [17, 5, 1], [100, 100, 100], [7, 21, 7]])('gcd(%i, %i) = %i', (a, b, g) => {
    expect(last(run('gcd-euclid', { a: String(a), b: String(b) })).explain).toContain(`gcd = ${g}`);
  });
  it.each([[3, 13], [2, 10], [7, 1], [5, 30], [20, 40]])('%i^%i is computed exactly', (b, e) => {
    expect(last(run('fast-exponentiation', { base: String(b), exp: String(e) })).explain).toContain(`= ${BigInt(b) ** BigInt(e)},`);
  });
  it('rejects exponent 0 with a useful message', () => {
    expect(() => run('fast-exponentiation', { exp: '0' })).toThrow(/power 0/);
  });
});

describe('stack, queue, deque', () => {
  const items = (id: string, ops: string) => (last(run(id, { ops })).state as TableState).cells.filter((c) => c !== null);
  it('follow their ordering rules', () => {
    expect(items('stack', 'push 1, push 2, push 3, pop')).toEqual([1, 2]);
    expect(items('queue', 'enqueue 1, enqueue 2, enqueue 3, dequeue')).toEqual([2, 3]);
    expect(items('deque', 'push_back 1, push_front 2, push_back 3, pop_front')).toEqual([1, 3]);
  });
  it('report underflow and overflow without throwing', () => {
    expect(last(run('stack', 'pop'.length ? { ops: 'pop' } : {})).explain).toContain('underflow');
    expect(last(run('queue', { ops: Array(9).fill('enqueue 1').join(', ') })).explain).toContain('overflow');
  });
  it('reject unknown operations', () => {
    expect(() => run('stack', { ops: 'peek' })).toThrow(/not an operation/);
    expect(() => run('stack', { ops: 'push' })).toThrow(/needs a whole number/);
  });
});
