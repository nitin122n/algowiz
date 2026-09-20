import { SearchTracer } from '../../core/tracer';
import { defineSearch } from './define';
import { binaryWindow, ruledOut } from './helpers';

/** Exponential search: double a bound until it passes the target, then binary search inside. */
export const exponentialSearch = defineSearch({
  id: 'exponential-search',
  name: 'Exponential Search',
  summary: 'Doubles an index bound (1, 2, 4, 8, ...) to find a range, then binary searches that range.',
  complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  pseudocode: [
    'if a[0] == target: return 0',
    'bound = 1',
    'while bound < n and a[bound] <= target: bound *= 2',
    'binary search in [bound/2, min(bound, n-1)]',
    'return -1',
  ],
  needsSorted: true,
  /** Records the run. */
  run({ array, target }) {
    const t = new SearchTracer(array, target);
    const n = array.length;
    if (n === 0) return t.notFound(4);
    if (t.probe(0, 0) === 0) return t.found(0, 0);
    let bound = 1;
    while (bound < n && t.probe(bound, 2, ruledOut(0, bound - 1), 'bound') <= 0) {
      if (array[bound] === target) return t.found(bound, 2);
      bound *= 2;
    }
    const lo = bound >> 1;
    const hi = Math.min(bound, n - 1);
    t.snap([], 3, `Target lies between indices ${lo} and ${hi}: binary search there.`);
    const r = binaryWindow(t, array, lo, hi, 3, 3);
    return r >= 0 ? t.found(r, 3) : t.notFound(4);
  },
});
