import { Tracer } from '../../core/tracer';
import { defineSort } from './define';
import { sortedMarks } from './helpers';

/** Insertion sort using adjacent swaps to sink each new element into the sorted prefix. */
export const insertionSort = defineSort({
  id: 'insertion-sort',
  name: 'Insertion Sort',
  summary: 'Grows a sorted prefix by sinking each next element into its place.',
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: [
    'for i from 1 to n-1',
    '  j = i',
    '  while j > 0 and a[j-1] > a[j]',
    '    swap a[j-1], a[j]; j = j-1',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    for (let i = 1; i < t.a.length; i++) {
      let j = i;
      t.note([...sortedMarks(0, i - 1), { kind: 'active', index: i }], 1, `Take ${t.a[i]} (index ${i}) and insert it into the sorted prefix.`);
      while (j > 0 && t.compare(j - 1, j, 2, sortedMarks(0, i))) {
        t.swap(j - 1, j, 3, sortedMarks(0, i));
        j--;
      }
    }
    return t.finish(0);
  },
});
