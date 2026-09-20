import { SearchTracer } from '../../core/tracer';
import type { Mark } from '../../core/step';
import { defineSearch } from './define';
import { ruledOut } from './helpers';

/** Jump search on a sorted array with block size floor(sqrt(n)). */
export const jumpSearch = defineSearch({
  id: 'jump-search',
  name: 'Jump Search',
  summary: 'Jumps ahead in blocks of √n until it passes the target, then scans the last block linearly.',
  complexity: { best: 'O(1)', average: 'O(√n)', worst: 'O(√n)', space: 'O(1)' },
  pseudocode: [
    'step = floor(sqrt(n)); prev = 0',
    'while a[min(step, n) - 1] < target',
    '  prev = step; step += floor(sqrt(n))',
    '  if prev >= n: return -1',
    'for i from prev to min(step, n) - 1',
    '  if a[i] == target: return i',
    'return -1',
  ],
  needsSorted: true,
  /** Records the run. */
  run({ array, target }) {
    const t = new SearchTracer(array, target);
    const n = array.length;
    if (n === 0) return t.notFound(6);
    const m = Math.max(1, Math.floor(Math.sqrt(n)));
    let prev = 0;
    let step = m;
    for (;;) {
      const idx = Math.min(step, n) - 1;
      const marks: Mark[] = [...ruledOut(0, prev - 1), { kind: 'pointer', index: prev, label: 'prev' }];
      if (t.probe(idx, 1, marks, 'jump') >= 0) break;
      t.snap([...marks, { kind: 'compare', index: idx }], 2, `${array[idx]} is still below the target, so jump ahead by ${m}.`);
      prev = step;
      step += m;
      if (prev >= n) return t.notFound(3);
    }
    const end = Math.min(step, n);
    for (let i = prev; i < end; i++) {
      const c = t.probe(i, 5, [...ruledOut(0, prev - 1), ...ruledOut(prev, i - 1)]);
      if (c === 0) return t.found(i, 5);
      if (c > 0) break;
    }
    return t.notFound(6);
  },
});
