import { REGISTRY } from '../../src/algorithms';
import { bestFit } from '../../src/core/fit';
import { trackIds } from '../../src/core/identity';
import { aggregate, labTasks, metricOf, runTask } from '../../src/core/lab';
import { scaleFor } from '../../src/core/scale';

/** Runs the whole lab for an algorithm synchronously. */
function measure(id: string) {
  const def = REGISTRY.get(id)!;
  const spec = scaleFor(def)!;
  const runs = labTasks(spec).map((t) => runTask(def, spec, t)).filter((r) => r !== null);
  return aggregate(runs as NonNullable<(typeof runs)[number]>[]);
}
/** Best-fit label for one shape and metric. */
const fitOf = (id: string, shape: string, metric: string) => bestFit(measure(id)[shape].map((p) => ({ x: p.x, y: metricOf(p, metric) })))?.cls.label;

describe('scaling recipes', () => {
  const scaled = REGISTRY.all.filter((d) => scaleFor(d));
  it('covers almost every algorithm', () => {
    const missing = REGISTRY.all.filter((d) => !scaleFor(d)).map((d) => d.id);
    expect(missing.sort()).toEqual(['sudoku', 'trie-insert', 'trie-search']);
  });
  it.each(scaled.map((d) => [d.id, d] as const))('%s runs at the smallest and largest size of every shape', (_id, def) => {
    const spec = scaleFor(def)!;
    for (const s of spec.shapes) {
      for (const n of [spec.sizes[0], spec.sizes[spec.sizes.length - 1]]) {
        const run = runTask(def, spec, { shape: s.id, n, seed: 1 });
        expect(run, `${s.id} n=${n}`).not.toBeNull();
        expect(run!.steps).toBeGreaterThan(1);
        expect(Number.isFinite(run!.x)).toBe(true);
      }
    }
  });
  it('sizes grow for every shape', () => {
    for (const def of scaled) {
      const pts = measure(def.id);
      for (const list of Object.values(pts)) expect(list.length, def.id).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('growth fitting', () => {
  it.each([
    ['bubble-sort', 'random', 'comparisons', 'n²'],
    ['selection-sort', 'sorted', 'comparisons', 'n²'],
    ['insertion-sort', 'sorted', 'comparisons', 'n'],
    ['merge-sort', 'random', 'comparisons', 'n log n'],
    ['linear-search', 'absent', 'comparisons', 'n'],
    ['binary-search', 'absent', 'comparisons', 'log n'],
    ['tower-of-hanoi', 'tower', 'moves', '2ⁿ'],
    ['fibonacci-tabulation', 'n', 'cells filled', 'n'],
  ])('%s on %s input: %s grows like %s', (id, shape, metric, cls) => {
    expect(fitOf(id, shape, metric)).toBe(cls);
  });
  it('recognizes constant, logarithmic, and linear memory', () => {
    expect(fitOf('bubble-sort', 'random', 'memory')).toBe('1');
    expect(fitOf('merge-sort', 'random', 'memory')).toBe('n');
    expect(fitOf('counting-sort', 'sorted', 'memory')).toBe('n');
  });
  it('quick sort on sorted input degrades to quadratic time and linear depth', () => {
    expect(fitOf('quick-sort', 'sorted', 'comparisons')).toBe('n²');
    expect(fitOf('quick-sort', 'sorted', 'memory')).toBe('n');
  });
  it('a BST built from sorted keys is a chain', () => {
    expect(fitOf('bst-search', 'sorted', 'comparisons')).toBe('n');
  });
  it('needs at least two points', () => {
    expect(bestFit([{ x: 1, y: 3 }])).toBeNull();
  });
});

describe('trackIds', () => {
  it('keeps ids for unmoved values and swaps ids on a swap', () => {
    const ids = trackIds([[3, 1, 2], [1, 3, 2]]);
    expect(ids[1]).toEqual([1, 0, 2]);
  });
  it('gives copies of values a fresh id', () => {
    const ids = trackIds([[5, 1], [1, 1], [1, 5]]);
    expect(ids[1]).toEqual([2, 1]);
    expect(ids[2][1]).toBe(3);
  });
  it('matches duplicates to the nearest spot', () => {
    const ids = trackIds([[2, 2, 9, 2], [2, 9, 2, 2]]);
    expect(ids[1]).toEqual([0, 2, 1, 3]);
  });
  it('reuses the same list when nothing changed', () => {
    const a = [1, 2];
    const ids = trackIds([a, a, [1, 2]]);
    expect(ids[2]).toBe(ids[0]);
  });
});
