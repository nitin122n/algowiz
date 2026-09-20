import { Tracer } from '../../core/tracer';
import { defineSort } from './define';

/** Shell sort with the simple n/2, n/4, ... 1 gap sequence. */
export const shellSort = defineSort({
  id: 'shell-sort',
  name: 'Shell Sort',
  summary: 'Insertion sort over shrinking gaps, so far-apart elements move quickly toward place.',
  complexity: { best: 'O(n log n)', average: 'O(n^1.5)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: [
    'for gap = n/2, n/4, ... , 1',
    '  for i from gap to n-1',
    '    j = i',
    '    while j >= gap and a[j-gap] > a[j]',
    '      swap a[j-gap], a[j]; j = j - gap',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    const n = t.a.length;
    for (let gap = n >> 1; gap >= 1; gap >>= 1) {
      t.note([], 0, `Gap ${gap}: sort elements that are ${gap} apart.`);
      for (let i = gap; i < n; i++) {
        let j = i;
        while (j >= gap && t.compare(j - gap, j, 3)) {
          t.swap(j - gap, j, 4);
          j -= gap;
        }
      }
    }
    return t.finish(0);
  },
});
