import { Tracer } from '../../core/tracer';
import { defineSort } from './define';

/** Quick sort with Lomuto partitioning and the last element as pivot. */
export const quickSort = defineSort({
  id: 'quick-sort',
  name: 'Quick Sort',
  summary: 'Picks a pivot, moves smaller values left of it and larger right, then recurses on both sides.',
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
  pseudocode: [
    'quickSort(lo, hi)',
    '  if lo < hi',
    '    pivot = a[hi]; i = lo',
    '    for j from lo to hi-1',
    '      if a[j] < pivot: swap a[i], a[j]; i++',
    '    swap a[i], a[hi]   // pivot is now final',
    '    quickSort(lo, i-1); quickSort(i+1, hi)',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    const done = new Set<number>();
    /** Marks of pivots already in their final position. */
    const fixed = () => [...done].map((index) => ({ kind: 'sorted' as const, index }));
    /** Sorts a[lo..hi] recursively. */
    const sort = (lo: number, hi: number): void => {
      if (lo > hi) return;
      if (lo === hi) {
        done.add(lo);
        return;
      }
      t.enter();
      const pivot = t.a[hi];
      t.note([...fixed(), { kind: 'pivot', index: hi, label: 'pivot' }], 2, `Choose ${pivot} (index ${hi}) as the pivot.`);
      let i = lo;
      for (let j = lo; j < hi; j++) {
        const pv = [...fixed(), { kind: 'pivot' as const, index: hi }];
        if (t.compare(hi, j, 4, pv)) {
          if (i !== j) t.swap(i, j, 4, pv);
          i++;
        }
      }
      if (i !== hi) t.swap(i, hi, 5, fixed());
      done.add(i);
      t.note(fixed(), 5, `Pivot ${pivot} is now at its final index ${i}.`);
      sort(lo, i - 1);
      sort(i + 1, hi);
      t.leave();
    };
    sort(0, t.a.length - 1);
    return t.finish(6);
  },
});
