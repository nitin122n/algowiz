import { Tracer } from '../../core/tracer';
import { defineSort } from './define';
import { sortedMarks } from './helpers';

/** Cocktail shaker sort: bubble sort that alternates direction each pass. */
export const cocktailSort = defineSort({
  id: 'cocktail-sort',
  name: 'Cocktail Shaker Sort',
  summary: 'Bubble sort in both directions: the largest sinks right, then the smallest floats left.',
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: [
    'lo = 0; hi = n-1',
    'while lo < hi',
    '  forward: for j lo..hi-1, swap if a[j] > a[j+1]; hi--',
    '  backward: for j hi..lo+1, swap if a[j-1] > a[j]; lo++',
    '  if no swaps in a full round: stop',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    let lo = 0;
    let hi = t.a.length - 1;
    while (lo < hi) {
      let swapped = false;
      for (let j = lo; j < hi; j++) {
        const done = [...sortedMarks(0, lo - 1), ...sortedMarks(hi + 1, t.a.length - 1)];
        if (t.compare(j, j + 1, 2, done)) {
          t.swap(j, j + 1, 2, done);
          swapped = true;
        }
      }
      hi--;
      for (let j = hi; j > lo; j--) {
        const done = [...sortedMarks(0, lo - 1), ...sortedMarks(hi + 1, t.a.length - 1)];
        if (t.compare(j - 1, j, 3, done)) {
          t.swap(j - 1, j, 3, done);
          swapped = true;
        }
      }
      lo++;
      if (!swapped) {
        t.note([], 4, 'No swaps in a full round trip: the array is sorted.');
        break;
      }
    }
    return t.finish(4);
  },
});
