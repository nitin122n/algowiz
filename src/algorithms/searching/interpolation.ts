import { SearchTracer, rangeMarks } from '../../core/tracer';
import { defineSearch } from './define';
import { ruledOut } from './helpers';

/** Interpolation search: guesses the position from the value, like looking up a name in a phone book. */
export const interpolationSearch = defineSearch({
  id: 'interpolation-search',
  name: 'Interpolation Search',
  summary: 'Estimates where the target should be from its value relative to the ends, then narrows in.',
  complexity: { best: 'O(1)', average: 'O(log log n)', worst: 'O(n)', space: 'O(1)' },
  pseudocode: [
    'lo = 0; hi = n-1',
    'while lo <= hi and a[lo] <= target <= a[hi]',
    '  pos = lo + (target - a[lo]) * (hi - lo) / (a[hi] - a[lo])',
    '  if a[pos] == target: return pos',
    '  if a[pos] < target: lo = pos+1 else hi = pos-1',
    'return -1',
  ],
  needsSorted: true,
  /** Records the run. */
  run({ array, target }) {
    const t = new SearchTracer(array, target);
    let lo = 0;
    let hi = array.length - 1;
    while (lo <= hi && target >= array[lo] && target <= array[hi]) {
      const span = array[hi] - array[lo];
      const pos = span === 0 ? lo : lo + Math.floor(((target - array[lo]) * (hi - lo)) / span);
      const marks = [
        ...ruledOut(0, lo - 1),
        ...ruledOut(hi + 1, array.length - 1),
        ...rangeMarks(lo, hi),
        { kind: 'pointer' as const, index: lo, label: 'lo' },
        { kind: 'pointer' as const, index: hi, label: 'hi' },
      ];
      const c = t.probe(pos, 3, marks, 'guess');
      if (c === 0) return t.found(pos, 3);
      if (c < 0) lo = pos + 1;
      else hi = pos - 1;
      t.snap(marks, 4, `Guess missed. The window is now indices ${lo}..${hi}.`);
    }
    return t.notFound(5);
  },
});
