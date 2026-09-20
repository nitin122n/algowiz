import { Tracer } from '../../core/tracer';
import { defineSort } from './define';

/** Cycle sort: each value is written directly to its final position, minimizing writes. */
export const cycleSort = defineSort({
  id: 'cycle-sort',
  name: 'Cycle Sort',
  summary: 'Rotates each cycle of misplaced values into place, writing every value at most once.',
  complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: [
    'for start from 0 to n-2',
    '  item = a[start]',
    '  pos = start + number of smaller values to the right',
    '  if pos == start: continue',
    '  skip duplicates; write item at pos; pick up the displaced value',
    '  repeat from the new item until the cycle returns to start',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    const n = t.a.length;
    /** Counts values right of `start` that are smaller than `item`, recording each comparison. */
    const place = (start: number, item: number): number => {
      let pos = start;
      for (let i = start + 1; i < n; i++) {
        if (t.compareVals(i, start, item, t.a[i], 2, [{ kind: 'active', index: start }])) pos++;
      }
      while (pos < n && item === t.a[pos] && pos !== start) pos++;
      return pos;
    };
    for (let start = 0; start < n - 1; start++) {
      let item = t.a[start];
      let pos = place(start, item);
      if (pos === start) {
        t.note([{ kind: 'active', index: start }], 3, `${item} is already in its final place.`);
        continue;
      }
      let displaced = t.a[pos];
      t.write(pos, item, 4, `Write ${item} to its final index ${pos}, picking up ${displaced}.`);
      item = displaced;
      while (pos !== start) {
        pos = place(start, item);
        displaced = t.a[pos];
        t.write(pos, item, 4, `Write ${item} to its final index ${pos}, picking up ${displaced}.`);
        item = displaced;
      }
    }
    return t.finish(5);
  },
});
