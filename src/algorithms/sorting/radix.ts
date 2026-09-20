import { Tracer } from '../../core/tracer';
import { defineSort } from './define';

/** LSD radix sort in base 10. Values are offset by the minimum so negatives work. */
export const radixSort = defineSort({
  id: 'radix-sort',
  name: 'Radix Sort',
  summary: 'Sorts digit by digit, from the least significant, using a stable pass for each digit.',
  complexity: { best: 'O(d·(n + b))', average: 'O(d·(n + b))', worst: 'O(d·(n + b))', space: 'O(n + b)' },
  pseudocode: [
    'for each digit position, least significant first',
    '  distribute the numbers into buckets 0..9 by that digit',
    '  collect the buckets in order (stable)',
    'after the last digit the array is sorted',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    if (t.a.length === 0) return t.finish(3);
    const min = Math.min(...t.a);
    const max = Math.max(...t.a) - min;
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      const buckets: number[][] = Array.from({ length: 10 }, () => []);
      t.alloc(t.a.length + 10);
      for (const v of t.a) buckets[Math.floor((v - min) / exp) % 10].push(v);
      const digitName = exp === 1 ? 'ones' : exp === 10 ? 'tens' : exp === 100 ? 'hundreds' : `10^${Math.log10(exp)}`;
      t.replace(buckets.flat(), 2, `Sort by the ${digitName} digit (stable): bucket sizes ${buckets.map((b) => b.length).join(', ')}.`, t.a.map((_, index) => ({ kind: 'active' as const, index })));
      t.free(t.a.length + 10);
    }
    return t.finish(3);
  },
});
