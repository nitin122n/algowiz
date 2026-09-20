import { Tracer } from '../../core/tracer';
import { defineSort } from './define';

/** Counting sort. Counts live in a Map so a wide value range never allocates a huge table. */
export const countingSort = defineSort({
  id: 'counting-sort',
  name: 'Counting Sort',
  summary: 'Counts how often each value occurs, then rewrites the array in order from the counts.',
  complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(k)' },
  pseudocode: [
    'count[v] = 0 for every value v',
    'for each x in a: count[x]++',
    'pos = 0',
    'for each value v in increasing order',
    '  repeat count[v] times: a[pos++] = v',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    const counts = new Map<number, number>();
    t.a.forEach((x, i) => {
      if (!counts.has(x)) t.alloc(1);
      counts.set(x, (counts.get(x) ?? 0) + 1);
      t.note([{ kind: 'active', index: i }], 1, `Tally ${x}: seen ${counts.get(x)} time${counts.get(x) === 1 ? '' : 's'} so far.`);
    });
    let pos = 0;
    for (const v of [...counts.keys()].sort((a, b) => a - b)) {
      for (let c = 0; c < (counts.get(v) as number); c++) {
        t.write(pos, v, 4, `Write ${v} to index ${pos} (it occurs ${counts.get(v)} time${counts.get(v) === 1 ? '' : 's'}).`, [
          { kind: 'sorted', index: pos },
        ]);
        pos++;
      }
    }
    return t.finish(3);
  },
});
