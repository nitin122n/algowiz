import { SearchTracer, rangeMarks } from '../../core/tracer';
import type { Mark } from '../../core/step';
import { defineSearch } from './define';
import { ruledOut } from './helpers';

/** Ternary search: split the window in three and keep the third that can hold the target. */
export const ternarySearch = defineSearch({
  id: 'ternary-search',
  name: 'Ternary Search',
  summary: 'Probes two points that split the window into thirds, then keeps only the third that can contain the target.',
  complexity: { best: 'O(1)', average: 'O(log₃ n)', worst: 'O(log₃ n)', space: 'O(1)' },
  pseudocode: [
    'lo = 0; hi = n-1',
    'while lo <= hi',
    '  m1 = lo + (hi-lo)/3; m2 = hi - (hi-lo)/3',
    '  if a[m1] == target: return m1; if a[m2] == target: return m2',
    '  if target < a[m1]: hi = m1-1',
    '  elif target > a[m2]: lo = m2+1',
    '  else: lo = m1+1; hi = m2-1',
    'return -1',
  ],
  needsSorted: true,
  /** Records the run. */
  run({ array, target }) {
    const t = new SearchTracer(array, target);
    let lo = 0;
    let hi = array.length - 1;
    while (lo <= hi) {
      const m1 = lo + Math.floor((hi - lo) / 3);
      const m2 = hi - Math.floor((hi - lo) / 3);
      const marks: Mark[] = [
        ...ruledOut(0, lo - 1),
        ...ruledOut(hi + 1, array.length - 1),
        ...rangeMarks(lo, hi),
        { kind: 'pointer', index: lo, label: 'lo' },
        { kind: 'pointer', index: hi, label: 'hi' },
      ];
      const c1 = t.probe(m1, 3, marks, 'm1');
      if (c1 === 0) return t.found(m1, 3);
      const c2 = m2 === m1 ? c1 : t.probe(m2, 3, marks, 'm2');
      if (c2 === 0) return t.found(m2, 3);
      if (c1 > 0) hi = m1 - 1;
      else if (c2 < 0) lo = m2 + 1;
      else {
        lo = m1 + 1;
        hi = m2 - 1;
      }
      t.snap(marks, c1 > 0 ? 4 : c2 < 0 ? 5 : 6, `Keep the third that can hold ${target}: indices ${lo}..${hi}.`);
    }
    return t.notFound(7);
  },
});
