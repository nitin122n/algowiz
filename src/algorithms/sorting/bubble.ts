import { Tracer } from '../../core/tracer';
import { defineSort } from './define';
import { sortedMarks } from './helpers';

/** Bubble sort with early exit when a pass makes no swaps. */
export const bubbleSort = defineSort({
  id: 'bubble-sort',
  name: 'Bubble Sort',
  summary: 'Repeatedly swaps adjacent out-of-order pairs so the largest values bubble to the end.',
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: [
    'for i from 0 to n-2',
    '  swapped = false',
    '  for j from 0 to n-i-2',
    '    if a[j] > a[j+1]',
    '      swap a[j], a[j+1]; swapped = true',
    '  if not swapped: stop',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    const n = t.a.length;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      const tail = sortedMarks(n - i, n - 1);
      for (let j = 0; j < n - i - 1; j++) {
        if (t.compare(j, j + 1, 3, tail)) {
          t.swap(j, j + 1, 4, tail);
          swapped = true;
        }
      }
      if (!swapped) {
        t.note(sortedMarks(0, n - 1), 5, 'No swaps in this pass, so everything is in order. Stop early.');
        break;
      }
    }
    return t.finish(5);
  },
});
