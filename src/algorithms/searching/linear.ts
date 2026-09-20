import { SearchTracer } from '../../core/tracer';
import { defineSearch } from './define';
import { ruledOut } from './helpers';

/** Linear search: check every element in turn. */
export const linearSearch = defineSearch({
  id: 'linear-search',
  name: 'Linear Search',
  summary: 'Checks each element from the left until it finds the target or runs out of elements.',
  complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  pseudocode: ['for i from 0 to n-1', '  if a[i] == target: return i', 'return -1'],
  needsSorted: false,
  /** Records the run. */
  run({ array, target }) {
    const t = new SearchTracer(array, target);
    for (let i = 0; i < array.length; i++) {
      if (t.probe(i, 1, ruledOut(0, i - 1)) === 0) return t.found(i, 1);
    }
    return t.notFound(2);
  },
});
