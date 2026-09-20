import { Tracer } from '../../core/tracer';
import { defineSort } from './define';
import { mergeRange, windowMarks } from './helpers';

/** Size of the short runs that get insertion-sorted first (real Tim sort uses 32-64). */
const RUN = 4;

/** Simplified Tim sort: insertion-sort small runs, then merge runs bottom-up. */
export const timSort = defineSort({
  id: 'tim-sort',
  name: 'Tim Sort (simplified)',
  summary: 'Insertion-sorts small runs, then merges neighboring runs, doubling their size each round.',
  complexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  pseudocode: [
    'split the array into runs of RUN elements',
    'insertion-sort every run',
    'size = RUN; while size < n',
    '  merge each pair of neighboring runs of length size',
    '  size = size * 2',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    const n = t.a.length;
    for (let s = 0; s < n; s += RUN) {
      const e = Math.min(s + RUN - 1, n - 1);
      t.note(windowMarks(s, e), 1, `Insertion-sort the run at indices ${s}..${e}.`);
      for (let i = s + 1; i <= e; i++) {
        for (let j = i; j > s && t.compare(j - 1, j, 1, windowMarks(s, e)); j--) t.swap(j - 1, j, 1, windowMarks(s, e));
      }
    }
    for (let size = RUN; size < n; size *= 2) {
      for (let lo = 0; lo + size < n; lo += 2 * size) {
        const mid = lo + size - 1;
        const hi = Math.min(lo + 2 * size - 1, n - 1);
        t.note(windowMarks(lo, hi), 3, `Merge runs ${lo}..${mid} and ${mid + 1}..${hi}.`);
        mergeRange(t, lo, mid, hi, 3, 3);
      }
    }
    return t.finish(4);
  },
});
