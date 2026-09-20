import { clampIndex, stepDelayMs } from '../../src/core/player';
import { mulberry32, makeArray, parseNumbers } from '../../src/core/random';
import { hrefFor, legacyHashPath, parseUrl } from '../../src/core/routes';
import { Tracer, SearchTracer } from '../../src/core/tracer';
import { createRegistry } from '../../src/core/registry';
import type { AlgorithmDef } from '../../src/core/step';

describe('player helpers', () => {
  it('clamps indices', () => {
    expect(clampIndex(-3, 5)).toBe(0);
    expect(clampIndex(9, 5)).toBe(4);
    expect(clampIndex(2, 5)).toBe(2);
    expect(clampIndex(3, 0)).toBe(0);
  });
  it('maps speed to delay and clamps speed', () => {
    expect(stepDelayMs(1)).toBe(800);
    expect(stepDelayMs(8)).toBe(100);
    expect(stepDelayMs(100)).toBe(100);
    expect(stepDelayMs(0)).toBe(3200);
  });
});

describe('random helpers', () => {
  it('is deterministic per seed', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('builds presets', () => {
    const s = makeArray('sorted', 10, 1);
    expect(s).toEqual([...s].sort((x, y) => x - y));
    const r = makeArray('reversed', 10, 1);
    expect(r).toEqual([...r].sort((x, y) => y - x));
    expect(new Set(makeArray('unique', 30, 1)).size).toBeLessThanOrEqual(4);
    expect(makeArray('random', 12, 3)).toHaveLength(12);
  });
  it('parses numbers and reports errors', () => {
    expect(parseNumbers('5, 3 ,8')).toEqual({ ok: true, values: [5, 3, 8] });
    expect(parseNumbers('[1 2 3]')).toEqual({ ok: true, values: [1, 2, 3] });
    expect(parseNumbers('')).toMatchObject({ ok: false });
    expect(parseNumbers('1, x')).toEqual({ ok: false, error: '"x" is not a whole number.' });
    expect(parseNumbers('1.5')).toMatchObject({ ok: false });
  });
});

describe('routes', () => {
  it('builds and parses paths with shareable state', () => {
    const href = hrefFor({ id: 'bubble-sort', q: '5,3,8', t: 3, s: 4 });
    expect(href).toBe('/algorithms/bubble-sort?q=5%2C3%2C8&t=3&s=4');
    const [path, search] = href.split('?');
    expect(parseUrl(path, `?${search}`)).toEqual({ page: 'algorithm', id: 'bubble-sort', q: '5,3,8', t: 3, s: 4 });
  });
  it('maps the fixed pages', () => {
    expect(hrefFor({ page: 'home' })).toBe('/');
    expect(hrefFor({ page: 'index' })).toBe('/algorithms');
    expect(parseUrl('/')).toEqual({ page: 'home', id: null });
    expect(parseUrl('/race/')).toEqual({ page: 'race', id: null });
    expect(parseUrl('/algorithms')).toEqual({ page: 'index', id: null });
  });
  it('treats unknown paths as missing', () => {
    expect(parseUrl('/nope').page).toBe('missing');
    expect(parseUrl('/algorithms/a/b').page).toBe('missing');
  });
  it('ignores bad numeric params and damaged form state', () => {
    expect(parseUrl('/algorithms/x', '?t=abc&s=-2&f=%7Bbroken')).toEqual({ page: 'algorithm', id: 'x' });
  });
  it('round-trips form fields', () => {
    const f = { edges: 'A-B:4, B-C:2' };
    const [path, search] = hrefFor({ id: 'dijkstra-graph', f }).split('?');
    expect(parseUrl(path, `?${search}`).f).toEqual(f);
  });
  it('redirects legacy hash links', () => {
    expect(legacyHashPath('#/a/bubble-sort?s=4')).toBe('/algorithms/bubble-sort?s=4');
    expect(legacyHashPath('#/race')).toBe('/race');
    expect(legacyHashPath('#/')).toBe('/');
    expect(legacyHashPath('#families')).toBeNull();
  });
});

describe('Tracer', () => {
  it('counts comparisons, swaps, writes and never mutates input', () => {
    const input = [3, 1, 2];
    const t = new Tracer(input);
    expect(t.compare(0, 1, 1)).toBe(true);
    t.swap(0, 1, 2);
    t.write(2, 9, 3);
    const steps = t.finish();
    expect(input).toEqual([3, 1, 2]);
    const last = steps[steps.length - 1];
    expect(last.stats).toEqual({ comparisons: 1, swaps: 1, writes: 1, memory: 0 });
    expect(last.state.array).toEqual([1, 3, 9]);
    expect(last.marks).toHaveLength(3);
  });
});

describe('SearchTracer', () => {
  it('records probe, found, and not found', () => {
    const t = new SearchTracer([1, 3, 5], 5);
    expect(t.probe(0, 1)).toBe(-1);
    expect(t.probe(2, 1)).toBe(0);
    const steps = t.found(2, 2);
    expect(steps[steps.length - 1].state.result).toBe(2);
    const m = new SearchTracer([1], 9);
    expect(m.notFound(3)[1].state.result).toBe(-1);
  });
});

describe('registry', () => {
  const def = (id: string): AlgorithmDef => ({
    id, name: id, family: 'sorting', summary: '', complexity: { best: '', average: '', worst: '', space: '' },
    pseudocode: [], theory: {}, input: { kind: 'array', maxSize: 5, defaultSize: 3 }, run: () => [], view: 'bars',
  });
  it('looks up and rejects duplicates', () => {
    const r = createRegistry([def('a'), def('b')]);
    expect(r.get('a')?.id).toBe('a');
    expect(r.get('zz')).toBeUndefined();
    expect(r.byFamily('sorting')).toHaveLength(2);
    expect(() => createRegistry([def('a'), def('a')])).toThrow('Duplicate');
  });
});
