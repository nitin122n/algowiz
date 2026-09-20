import { mulberry32 } from '../../core/random';
import { Tracer } from '../../core/tracer';
import { defineSort } from './define';

/** True when the array is in non-decreasing order. */
function isSorted(a: number[]): boolean {
  return a.every((v, i) => i === 0 || a[i - 1] <= v);
}

/** Bogo sort: shuffle until sorted. Deterministic seed so runs are reproducible. Limited to 5 elements. */
export const bogoSort = defineSort({
  id: 'bogo-sort',
  name: 'Bogo Sort',
  summary: 'Shuffles the array at random until it happens to be sorted. A joke algorithm that shows why complexity matters.',
  complexity: { best: 'O(n)', average: 'O(n·n!)', worst: 'unbounded', space: 'O(1)' },
  pseudocode: [
    'while the array is not sorted',
    '  shuffle the array randomly',
    'return the array',
  ],
  maxSize: 5,
  defaultSize: 5,
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    // Seed from the input so the same data always produces the same run.
    const rnd = mulberry32(input.reduce((h, v) => (h * 31 + v) | 0, 17));
    let attempts = 0;
    // Hard cap keeps the step list finite; with n <= 5 (120 orderings) reaching it is astronomically unlikely.
    while (!isSorted(t.a) && attempts < 5000) {
      attempts++;
      const shuffled = [...t.a];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      t.replace(shuffled, 1, `Shuffle #${attempts}: ${isSorted(shuffled) ? 'lucky, it is sorted!' : 'still not sorted.'}`);
    }
    return t.finish(2);
  },
});
