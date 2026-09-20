import { SearchTracer } from '../../core/tracer';
import { defineSearch } from './define';
import { binaryWindow } from './helpers';

/** Binary search on a sorted array. */
export const binarySearch = defineSearch({
  id: 'binary-search',
  name: 'Binary Search',
  summary: 'Compares with the middle of a sorted window and discards the half that cannot hold the target.',
  complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  pseudocode: [
    'lo = 0; hi = n-1',
    'while lo <= hi',
    '  mid = (lo + hi) / 2',
    '  if a[mid] == target: return mid',
    '  if a[mid] < target: lo = mid+1 else hi = mid-1',
    'return -1',
  ],
  needsSorted: true,
  /** Records the run. */
  run({ array, target }) {
    const t = new SearchTracer(array, target);
    const r = binaryWindow(t, array, 0, array.length - 1, 3, 4);
    return r >= 0 ? t.found(r, 3) : t.notFound(5);
  },
});
