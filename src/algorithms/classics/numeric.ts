import { InputError, int } from '../../core/forms';
import { shape, spread } from '../../core/scale';
import type { Mark } from '../../core/step';
import { Table, cellMark } from '../../core/table';
import { defineForm } from '../define';

/** Sieve of Eratosthenes. */
export const sieve = defineForm({
  id: 'sieve-of-eratosthenes',
  name: 'Sieve of Eratosthenes',
  family: 'classics',
  group: 'Number theory',
  summary: 'Finds all primes up to N by crossing out the multiples of each prime, starting from its square.',
  complexity: { best: 'O(n log log n)', average: 'O(n log log n)', worst: 'O(n log log n)', space: 'O(n)' },
  pseudocode: ['assume every number from 2 to N is prime', 'for p from 2 while p * p <= N', '  if p is still not crossed out (so p is prime)', '    cross out p*p, p*p + p, p*p + 2p, ... up to N', 'every number not crossed out is prime'],
  form: [{ key: 'n', label: 'Find primes up to', type: 'int', default: 50, min: 10, max: 100 }],
  randomize: (seed) => ({ n: String(30 + (seed % 8) * 10) }),
  scale: { sizes: spread(10, 100), unit: 'N', shapes: [shape('primes', 'Primes up to N')], make: (n) => ({ n }), sizeOf: (i) => int(i, 'n') },
  view: 'cells',
  run(input) {
    const N = int(input, 'n');
    const cols = 10;
    const rows = Math.ceil((N + 1) / cols);
    const t = new Table(rows, cols, ['primes found', 'crossed out'], Array.from({ length: rows }, (_, r) => `${r * cols}s`), Array.from({ length: cols }, (_, c) => String(c)));
    for (let v = 2; v <= N; v++) t.cells[v] = v;
    const crossed = new Set<number>();
    const primes = new Set<number>();
    /** Marks that describe the current state of the sieve. */
    const base = (extra: Mark[] = []): Mark[] => [...[...primes].map((index) => ({ kind: 'found' as const, index })), ...[...crossed].map((index) => ({ kind: 'notfound' as const, index })), ...extra];
    t.rec.alloc(N + 1);
    t.snap([], 0, `Every number from 2 to ${N} starts as a possible prime.`);
    for (let p = 2; p * p <= N; p++) {
      if (crossed.has(p)) continue;
      primes.add(p);
      t.rec.count('primes found');
      t.snap(base([{ kind: 'active', index: p }]), 2, `${p} is not crossed out, so it is prime. Cross out its multiples starting at ${p}² = ${p * p}.`);
      for (let m = p * p; m <= N; m += p) {
        if (crossed.has(m)) continue;
        crossed.add(m);
        t.rec.count('crossed out');
        t.snap(base([{ kind: 'compare', index: m }, { kind: 'active', index: p }]), 3, `${m} = ${p} x ${m / p}: not prime, cross it out.`);
      }
    }
    for (let v = 2; v <= N; v++) if (!crossed.has(v) && !primes.has(v)) (primes.add(v), t.rec.count('primes found'));
    t.snap(base(), 4, `Done: ${primes.size} primes up to ${N}: ${[...primes].sort((a, b) => a - b).join(', ')}.`);
    return t.steps;
  },
});

/** Euclid's GCD. */
export const gcd = defineForm({
  id: 'gcd-euclid',
  name: "GCD (Euclid's Algorithm)",
  family: 'classics',
  group: 'Number theory',
  summary: 'gcd(a, b) = gcd(b, a mod b). Keep replacing the pair until the remainder is 0; the last divisor is the answer.',
  complexity: { best: 'O(1)', average: 'O(log min(a, b))', worst: 'O(log min(a, b))', space: 'O(1)' },
  pseudocode: ['while b != 0', '  r = a mod b', '  a = b; b = r', 'return a'],
  form: [
    { key: 'a', label: 'a', type: 'int', default: 1071, min: 1, max: 1000000 },
    { key: 'b', label: 'b', type: 'int', default: 462, min: 1, max: 1000000 },
  ],
  randomize: (seed) => ({ a: String(100 + ((seed * 7919) % 900)), b: String(50 + ((seed * 104729) % 400)) }),
  scale: { sizes: spread(3, 24, 8), unit: 'value of b', shapes: [shape('fibonacci', 'Consecutive Fibonacci numbers (worst case)')], make: (k) => { let a = 1; let b = 1; for (let i = 0; i < k; i++) [a, b] = [a + b, a]; return { a, b }; }, sizeOf: (i) => int(i, 'b') },
  view: 'cells',
  run(input) {
    let a = int(input, 'a');
    let b = int(input, 'b');
    const pairs: Array<[number, number, number]> = [];
    while (b !== 0) {
      pairs.push([a, b, a % b]);
      [a, b] = [b, a % b];
    }
    const t = new Table(pairs.length, 3, ['divisions'], pairs.map((_, i) => `step ${i + 1}`), ['a', 'b', 'a mod b']);
    t.rec.raise('memory', 0);
    t.snap([], 0, `Find gcd(${pairs[0][0]}, ${pairs[0][1]}).`);
    pairs.forEach(([x, y, rem], i) => {
      t.set(i, 0, x);
      t.set(i, 1, y);
      t.set(i, 2, rem);
      t.rec.count('divisions');
      t.snap([cellMark(t, 'active', i, 0), cellMark(t, 'active', i, 1), cellMark(t, 'insert', i, 2)], 1, `${x} = ${Math.floor(x / y)} x ${y} + ${rem}, so the remainder is ${rem}.${rem === 0 ? '' : ` Next pair: (${y}, ${rem}).`}`);
    });
    const g = pairs.at(-1)?.[1] ?? a;
    t.snap([cellMark(t, 'found', pairs.length - 1, 1)], 3, `The remainder is 0, so the answer is the last divisor: gcd = ${g}.`);
    return t.steps;
  },
});

/** Fast exponentiation by squaring. */
export const fastPower = defineForm({
  id: 'fast-exponentiation',
  name: 'Fast Exponentiation',
  family: 'classics',
  group: 'Number theory',
  summary: 'Computes base^exp with about log₂(exp) multiplications by squaring the base and using the bits of the exponent.',
  complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  pseudocode: ['result = 1', 'while exp > 0', '  if exp is odd: result = result * base', '  base = base * base', '  exp = exp / 2 (drop the lowest bit)', 'return result'],
  form: [
    { key: 'base', label: 'Base', type: 'int', default: 3, min: 1, max: 20 },
    { key: 'exp', label: 'Exponent', type: 'int', default: 13, min: 0, max: 40 },
  ],
  randomize: (seed) => ({ base: String(2 + (seed % 8)), exp: String(5 + ((seed * 7) % 30)) }),
  scale: { sizes: spread(1, 40), unit: 'exponent', shapes: [shape('base3', 'Base 3')], make: (n) => ({ base: 3, exp: n }), sizeOf: (i) => int(i, 'exp') },
  view: 'cells',
  run(input) {
    const b0 = BigInt(int(input, 'base'));
    const e0 = int(input, 'exp');
    if (e0 === 0) throw new InputError('Any base to the power 0 is 1. Choose an exponent of at least 1 to see the steps.');
    const bits = e0.toString(2).length;
    const t = new Table(bits, 4, ['multiplications'], Array.from({ length: bits }, (_, i) => `round ${i + 1}`), ['base', 'exponent', 'bit', 'result']);
    let base = b0;
    let e = e0;
    let result = 1n;
    t.rec.raise('memory', 0);
    t.snap([], 0, `${b0}^${e0}: exponent in binary is ${e0.toString(2)}.`);
    for (let i = 0; i < bits; i++) {
      const odd = e % 2 === 1;
      t.set(i, 0, String(base));
      t.set(i, 1, e);
      t.set(i, 2, odd ? 1 : 0);
      if (odd) (result *= base, t.rec.count('multiplications'));
      t.set(i, 3, String(result));
      t.snap([cellMark(t, 'active', i, 0), cellMark(t, odd ? 'found' : 'notfound', i, 2), cellMark(t, 'insert', i, 3)], odd ? 2 : 3, odd ? `The lowest bit is 1: multiply the result by ${base}. Result = ${result}.` : `The lowest bit is 0: skip.`);
      base *= base;
      t.rec.count('multiplications');
      e = Math.floor(e / 2);
    }
    t.snap([cellMark(t, 'found', bits - 1, 3)], 5, `${b0}^${e0} = ${result}, using ${bits} rounds instead of ${e0 - 1} multiplications.`);
    return t.steps;
  },
});
