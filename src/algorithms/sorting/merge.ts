import { Tracer } from '../../core/tracer';
import { defineSort } from './define';
import { mergeRange, windowMarks } from './helpers';

/** Top-down merge sort. */
export const mergeSort = defineSort({
  id: 'merge-sort',
  name: 'Merge Sort',
  summary: 'Splits the array in halves, sorts each half, then merges the sorted halves.',
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  pseudocode: [
    'mergeSort(lo, hi)',
    '  if lo >= hi: return',
    '  mid = (lo + hi) / 2',
    '  mergeSort(lo, mid); mergeSort(mid+1, hi)',
    '  merge: take the smaller front value of each half',
    '  write it back into a[lo..hi]',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    /** Sorts a[lo..hi] recursively. */
    const sort = (lo: number, hi: number): void => {
      if (lo >= hi) return;
      t.enter();
      const mid = (lo + hi) >> 1;
      t.note(windowMarks(lo, hi), 2, `Split indices ${lo}..${hi} at ${mid}.`);
      sort(lo, mid);
      sort(mid + 1, hi);
      t.note(windowMarks(lo, hi), 3, `Merge the sorted halves ${lo}..${mid} and ${mid + 1}..${hi}.`);
      mergeRange(t, lo, mid, hi, 4, 5);
      t.leave();
    };
    sort(0, t.a.length - 1);
    return t.finish(3);
  },
});
