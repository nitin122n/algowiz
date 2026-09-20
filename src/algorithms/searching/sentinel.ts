import { SearchTracer } from '../../core/tracer';
import { defineSearch } from './define';
import { ruledOut } from './helpers';

/** Sentinel linear search: plants the target at the end so the loop needs no bounds check. */
export const sentinelSearch = defineSearch({
  id: 'sentinel-search',
  name: 'Sentinel Linear Search',
  summary: 'Temporarily puts the target at the last cell so the scan loop never has to check for the end.',
  complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  pseudocode: [
    'last = a[n-1]; a[n-1] = target   // sentinel',
    'i = 0',
    'while a[i] != target: i++',
    'a[n-1] = last                    // restore',
    'if i < n-1 or last == target: return i',
    'return -1',
  ],
  needsSorted: false,
  /** Records the run. */
  run({ array, target }) {
    const t = new SearchTracer(array, target);
    const n = array.length;
    if (n === 0) return t.notFound(5);
    const last = array[n - 1];
    const planted = [...array];
    planted[n - 1] = target;
    t.setArray(planted);
    t.snap([{ kind: 'insert', index: n - 1, label: 'sentinel' }], 0, `Plant the target ${target} at the last cell (it held ${last}).`);
    let i = 0;
    while (t.probe(i, 2, ruledOut(0, i - 1)) !== 0) i++;
    t.setArray(array);
    t.snap([{ kind: 'active', index: n - 1 }], 3, `Restore the last cell to ${last}.`);
    return i < n - 1 || last === target ? t.found(i, 4) : t.notFound(5);
  },
});
