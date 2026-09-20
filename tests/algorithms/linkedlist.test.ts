import { LINKED_LISTS } from '../../src/algorithms/linkedlist';

/** Reference result for each operation on a plain array. */
function expected(op: string, list: number[], value: number, index: number): number[] {
  const n = list.length;
  switch (op) {
    case 'insert-head': return [value, ...list];
    case 'insert-tail': return [...list, value];
    case 'insert-pos': return index >= 0 && index <= n ? [...list.slice(0, index), value, ...list.slice(index)] : list;
    case 'delete-head': return list.slice(1);
    case 'delete-tail': return list.slice(0, -1);
    case 'delete-pos': return index >= 0 && index < n ? list.filter((_, i) => i !== index) : list;
    case 'reverse': return [...list].reverse();
    default: return list;
  }
}

describe.each(LINKED_LISTS.map((d) => [d.id, d] as const))('%s', (id, def) => {
  const op = id.replace(/^(singly|doubly|circular)-/, '');
  const lists = [[], [4], [4, 8], [4, 8, 15, 16, 23, 42]];
  it('matches the reference result on every list and index', () => {
    for (const list of lists) {
      for (const index of [-1, 0, 1, 2, list.length, list.length + 1]) {
        const copy = [...list];
        const steps = def.run({ list, value: 99, index });
        expect(list).toEqual(copy);
        expect(steps[steps.length - 1].state.nodes).toEqual(expected(op, list, 99, index));
        expect(steps.length).toBeGreaterThan(1);
      }
    }
  });
  it('search finds present values and reports absent ones', () => {
    if (op !== 'search') return;
    const found = def.run({ list: [4, 8, 15], value: 8, index: 0 });
    expect(found[found.length - 1].marks[0].kind).toBe('found');
    const missing = def.run({ list: [4, 8, 15], value: 7, index: 0 });
    expect(missing[missing.length - 1].explain).toContain('not in the list');
  });
  it('middle points at floor(n/2)', () => {
    if (op !== 'middle') return;
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const list = Array.from({ length: n }, (_, i) => i * 10);
      const last = def.run({ list, value: 0, index: 0 }).at(-1)!;
      expect(last.marks[0].index).toBe(Math.floor(n / 2));
    }
  });
});
