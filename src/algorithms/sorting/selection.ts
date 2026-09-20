import { Tracer } from '../../core/tracer';
import { defineSort } from './define';
import { sortedMarks } from './helpers';

/** Selection sort: repeatedly select the minimum of the unsorted part. */
export const selectionSort = defineSort({
  id: 'selection-sort',
  name: 'Selection Sort',
  summary: 'Finds the smallest remaining value and swaps it into the next sorted position.',
  complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: [
    'for i from 0 to n-2',
    '  min = i',
    '  for j from i+1 to n-1',
    '    if a[j] < a[min]: min = j',
    '  swap a[i], a[min]',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    const n = t.a.length;
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      const done = sortedMarks(0, i - 1);
      t.note([...done, { kind: 'pointer', index: min, label: 'min' }], 1, `Assume index ${i} holds the minimum.`);
      for (let j = i + 1; j < n; j++) {
        if (t.compare(min, j, 3, [...done, { kind: 'pointer', index: min, label: 'min' }])) {
          min = j;
          t.note([...done, { kind: 'pointer', index: min, label: 'min' }], 3, `New minimum ${t.a[min]} at index ${min}.`);
        }
      }
      if (min !== i) t.swap(i, min, 4, done);
      else t.note([...done, { kind: 'active', index: i }], 4, `Index ${i} already holds the minimum; no swap.`);
    }
    return t.finish(4);
  },
});
