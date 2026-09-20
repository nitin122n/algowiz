import { SEARCHING } from '../../src/algorithms/searching';
import { makeArray } from '../../src/core/random';

const sortedArr = (n: number, seed: number) => makeArray('random', n, seed).sort((a, b) => a - b);

describe.each(SEARCHING.map((d) => [d.id, d] as const))('%s', (_id, def) => {
  const base: number[][] = [[], [5], [1, 3, 5, 7, 9, 11, 13], [1, 2, 2, 2, 3, 4], [-9, -4, 0, 3, 3, 8], [4, 4, 4, 4], sortedArr(30, 1), sortedArr(57, 2)];
  const arrays = def.input.needsSorted ? base : [...base, [9, 2, 7, 4, 1], makeArray('random', 25, 5)];
  it('finds every present value and reports absent ones', () => {
    for (const arr of arrays) {
      const min = arr.length ? Math.min(...arr) : 0;
      const max = arr.length ? Math.max(...arr) : 0;
      const targets = [...new Set([...arr, min - 1, max + 1, Math.floor((min + max) / 2) + 0.5 | 0])];
      for (const target of targets) {
        const copy = [...arr];
        const steps = def.run({ array: arr, target });
        expect(arr).toEqual(copy);
        const r = steps[steps.length - 1].state.result;
        expect(r).not.toBeNull();
        if (arr.includes(target)) {
          expect(r).toBeGreaterThanOrEqual(0);
          expect(arr[r as number]).toBe(target);
        } else {
          expect(r).toBe(-1);
        }
        // Only the final step carries a result.
        expect(steps.slice(0, -1).every((s) => s.state.result === null)).toBe(true);
      }
    }
  });
});
