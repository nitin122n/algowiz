import { SearchTracer, rangeMarks } from '../../core/tracer';
import type { Mark } from '../../core/step';
import { defineSearch } from './define';
import { ruledOut } from './helpers';

/** Fibonacci search: like binary search but splits the window using Fibonacci numbers (only + and -). */
export const fibonacciSearch = defineSearch({
  id: 'fibonacci-search',
  name: 'Fibonacci Search',
  summary: 'Splits a sorted array at Fibonacci-number offsets, so it needs only addition and subtraction to narrow in.',
  complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  pseudocode: [
    'find the smallest Fibonacci number fibM >= n',
    'offset = -1',
    'while fibM > 1',
    '  i = min(offset + fib(m-2), n-1)',
    '  if a[i] < target: move the window right, offset = i',
    '  elif a[i] > target: shrink the window to the left part',
    '  else: return i',
    'return -1',
  ],
  needsSorted: true,
  /** Records the run. */
  run({ array, target }) {
    const t = new SearchTracer(array, target);
    const n = array.length;
    if (n === 0) return t.notFound(7);
    let fib2 = 0;
    let fib1 = 1;
    let fib = fib1 + fib2;
    while (fib < n) {
      fib2 = fib1;
      fib1 = fib;
      fib = fib1 + fib2;
    }
    let offset = -1;
    while (fib > 1) {
      const i = Math.min(offset + fib2, n - 1);
      const marks: Mark[] = [...ruledOut(0, offset), ...rangeMarks(offset + 1, Math.min(offset + fib, n - 1))];
      const c = t.probe(i, 3, marks, 'probe');
      if (c < 0) {
        fib = fib1;
        fib1 = fib2;
        fib2 = fib - fib1;
        offset = i;
        t.snap(marks, 4, `Too small: move the window right (offset ${offset}).`);
      } else if (c > 0) {
        fib = fib2;
        fib1 = fib1 - fib2;
        fib2 = fib - fib1;
        t.snap(marks, 5, 'Too big: keep the left part of the window.');
      } else return t.found(i, 6);
    }
    if (fib1 === 1 && offset + 1 < n && t.probe(offset + 1, 6, ruledOut(0, offset)) === 0) return t.found(offset + 1, 6);
    return t.notFound(7);
  },
});
