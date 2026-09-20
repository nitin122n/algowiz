import { REGISTRY } from '../../src/algorithms';
import type { SearchInput, ListInput } from '../../src/core/step';
import { makeArray } from '../../src/core/random';
import { buildForm, defaultRaw } from '../../src/core/forms';

/** Builds the default input for an algorithm, the same way the UI does. */
function defaultInput(def: (typeof REGISTRY.all)[number]): unknown {
  if (def.input.kind === 'form') {
    const built = buildForm(def.input.form!, defaultRaw(def));
    if (!built.ok) throw new Error(`${def.id}: ${built.error}`);
    return built.input;
  }
  const n = def.input.defaultSize;
  const arr = makeArray('random', n, 11);
  if (def.input.kind === 'array') return arr;
  if (def.input.kind === 'array+target') {
    const array = def.input.needsSorted ? [...arr].sort((a, b) => a - b) : arr;
    return { array, target: array[Math.floor(n / 2)] } satisfies SearchInput;
  }
  return { list: arr.slice(0, n), value: 77, index: Math.min(2, n) } satisfies ListInput;
}

describe('registry contract', () => {
  it('has unique ids and 110+ algorithms', () => {
    expect(new Set(REGISTRY.all.map((d) => d.id)).size).toBe(REGISTRY.all.length);
    expect(REGISTRY.all.length).toBeGreaterThanOrEqual(110);
  });
  describe.each(REGISTRY.all.map((d) => [d.id, d] as const))('%s', (_id, def) => {
    const steps = def.run(defaultInput(def));
    it('has metadata', () => {
      expect(def.name).not.toBe('');
      expect(def.summary).not.toBe('');
      expect(def.pseudocode.length).toBeGreaterThan(0);
    });
    it('emits valid steps', () => {
      expect(steps.length).toBeGreaterThan(1);
      expect(steps.length).toBeLessThan(20000);
      steps.forEach((s) => {
        expect(s.explain.trim()).not.toBe('');
        if (s.line !== null) {
          expect(s.line).toBeGreaterThanOrEqual(0);
          expect(s.line).toBeLessThan(def.pseudocode.length);
        }
      });
    });
    it('never decreases stats', () => {
      for (let i = 1; i < steps.length; i++) {
        for (const [k, v] of Object.entries(steps[i].stats)) expect(v).toBeGreaterThanOrEqual(steps[i - 1].stats[k] ?? 0);
      }
    });
  });
});

describe('random inputs', () => {
  const forms = REGISTRY.all.filter((d) => d.input.kind === 'form' && d.input.randomize);
  it.each(forms.map((d) => [d.id, d] as const))('%s runs on seeds 1 to 8', (_id, def) => {
    for (let seed = 1; seed <= 8; seed++) {
      const raw = { ...defaultRaw(def), ...def.input.randomize!(seed) };
      const built = buildForm(def.input.form!, raw);
      if (!built.ok) throw new Error(`seed ${seed}: ${built.error}`);
      const steps = def.run(built.input);
      expect(steps.length).toBeGreaterThan(1);
      expect(steps.length).toBeLessThan(20000);
    }
  });
});

describe('theory coverage', () => {
  it('every algorithm has an invariant or notes to show', () => {
    const missing = REGISTRY.all.filter((d) => !d.theory.invariant && !(d.theory.notes && d.theory.notes.length)).map((d) => d.id);
    expect(missing).toEqual([]);
  });
});
