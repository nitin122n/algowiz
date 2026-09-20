import { SORTING } from '../../src/algorithms/sorting';
import { makeArray } from '../../src/core/random';

const asc = (a: number[]) => [...a].sort((x, y) => x - y);

describe.each(SORTING.map((d) => [d.id, d] as const))('%s', (_id, def) => {
  const cases: Record<string, number[]> = {
    empty: [],
    single: [7],
    two: [2, 1],
    duplicates: [3, 1, 3, 2, 1, 3],
    negatives: [-5, 3, -1, 0, 3, -9],
    sorted: [1, 2, 3, 4, 5],
    reversed: [5, 4, 3, 2, 1],
    ...Object.fromEntries([1, 2, 3].map((s) => [`random${s}`, makeArray('random', Math.min(def.input.maxSize, 12), s)])),
    wide: [1000000, 3, 250000, -70, 3],
  };
  it.each(Object.entries(cases).filter(([, v]) => v.length <= def.input.maxSize))('sorts %s', (_n, input) => {
    const copy = [...input];
    const steps = def.run(input);
    expect(input).toEqual(copy);
    expect(steps[steps.length - 1].state.array).toEqual(asc(input));
  });
  it('sorts default-size random input', () => {
    const input = makeArray('random', def.input.defaultSize, 42);
    const steps = def.run(input);
    expect(steps[steps.length - 1].state.array).toEqual(asc(input));
  });
});
