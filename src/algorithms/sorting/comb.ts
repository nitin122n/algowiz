import { Tracer } from '../../core/tracer';
import { defineSort } from './define';

/** Comb sort with shrink factor 1.3. */
export const combSort = defineSort({
  id: 'comb-sort',
  name: 'Comb Sort',
  summary: 'Bubble sort that compares far-apart elements first, shrinking the gap by 1.3 each round.',
  complexity: { best: 'O(n log n)', average: 'O(n²/2^p)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: [
    'gap = n; shrink = 1.3; sorted = false',
    'while not sorted',
    '  gap = max(1, floor(gap / shrink)); sorted = (gap == 1)',
    '  for i from 0 to n-gap-1',
    '    if a[i] > a[i+gap]: swap; sorted = false',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    const n = t.a.length;
    let gap = n;
    let sorted = n < 2;
    while (!sorted) {
      gap = Math.max(1, Math.floor(gap / 1.3));
      sorted = gap === 1;
      t.note([], 2, `Gap is now ${gap}.`);
      for (let i = 0; i + gap < n; i++) {
        if (t.compare(i, i + gap, 4)) {
          t.swap(i, i + gap, 4);
          sorted = false;
        }
      }
    }
    return t.finish(1);
  },
});
