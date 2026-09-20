import { Tracer } from '../../core/tracer';
import { defineSort } from './define';

/** Bucket sort with about sqrt(n) evenly spaced buckets, each sorted by insertion. */
export const bucketSort = defineSort({
  id: 'bucket-sort',
  name: 'Bucket Sort',
  summary: 'Spreads values into buckets by range, sorts each small bucket, then concatenates them.',
  complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n²)', space: 'O(n + k)' },
  pseudocode: [
    'make k empty buckets covering [min, max]',
    'put each value in its bucket',
    'sort each bucket (insertion sort)',
    'write the buckets back in order',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    const n = t.a.length;
    if (n === 0) return t.finish(3);
    const k = Math.max(1, Math.ceil(Math.sqrt(n)));
    const min = Math.min(...t.a);
    const max = Math.max(...t.a);
    const width = (max - min + 1) / k;
    const buckets: number[][] = Array.from({ length: k }, () => []);
    t.alloc(n + k);
    t.a.forEach((v, i) => {
      const b = Math.min(k - 1, Math.floor((v - min) / width));
      buckets[b].push(v);
      t.note([{ kind: 'active', index: i }], 1, `Put ${v} into bucket ${b} (values ${Math.ceil(min + b * width)}..${Math.floor(min + (b + 1) * width - 1e-9)}).`);
    });
    for (const b of buckets) {
      // Plain insertion sort on a small bucket; its comparisons are not animated.
      for (let i = 1; i < b.length; i++) {
        const key = b[i];
        let j = i - 1;
        while (j >= 0 && b[j] > key) {
          b[j + 1] = b[j];
          j--;
        }
        b[j + 1] = key;
      }
    }
    t.note([], 2, `Each of the ${k} buckets is now sorted internally.`);
    let pos = 0;
    for (const [bi, b] of buckets.entries()) {
      for (const v of b) {
        t.write(pos, v, 3, `Write ${v} from bucket ${bi} to index ${pos}.`, [{ kind: 'sorted', index: pos }]);
        pos++;
      }
    }
    return t.finish(3);
  },
});
