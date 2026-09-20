import { TREES } from '../../src/algorithms/tree';
import { buildForm, defaultRaw } from '../../src/core/forms';
import type { Step, TreeState } from '../../src/core/step';

const byId = (id: string) => TREES.find((d) => d.id === id)!;

/** Typed input from defaults, optionally overridden by seeded random values or explicit raw text. */
function makeInput(id: string, seed?: number, override: Record<string, string> = {}) {
  const def = byId(id);
  const raw = { ...defaultRaw(def), ...(seed !== undefined ? def.input.randomize!(seed) : {}), ...override };
  const built = buildForm(def.input.form!, raw);
  if (!built.ok) throw new Error(built.error);
  return built.input;
}

const finalState = (steps: Step<TreeState>[]) => steps.at(-1)!.state;
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** In-order keys of a binary TreeState. */
function inorderKeys(s: TreeState): number[] {
  const out: number[] = [];
  const walk = (id: number | null): void => {
    if (id === null) return;
    const n = s.nodes[id];
    walk(n.children[0]);
    out.push(Number(n.label));
    walk(n.children[1]);
  };
  s.roots.forEach(walk);
  return out;
}

/** Height of a subtree in a binary TreeState. */
function heightOf(s: TreeState, id: number | null): number {
  if (id === null) return 0;
  const n = s.nodes[id];
  return 1 + Math.max(heightOf(s, n.children[0]), heightOf(s, n.children[1]));
}

const distinct = (a: number[]) => [...new Set(a)];

describe('BST', () => {
  it.each(SEEDS)('insert keeps sorted order and adds the key (seed %i)', (seed) => {
    const input = makeInput('bst-insert', seed);
    const keys = distinct(input.keys as number[]);
    const v = input.value as number;
    const out = inorderKeys(finalState(byId('bst-insert').run(input)));
    expect(out).toEqual([...new Set([...keys, v])].sort((a, b) => a - b));
  });
  it.each(SEEDS)('delete removes exactly the key (seed %i)', (seed) => {
    const input = makeInput('bst-delete', seed);
    const keys = distinct(input.keys as number[]);
    const v = input.value as number;
    const out = inorderKeys(finalState(byId('bst-delete').run(input)));
    expect(out).toEqual(keys.filter((k) => k !== v).sort((a, b) => a - b));
  });
  it('deletes the root with two children', () => {
    const out = inorderKeys(finalState(byId('bst-delete').run(makeInput('bst-delete'))));
    expect(out).toEqual([20, 30, 35, 40, 60, 65, 70, 80]);
  });
  it.each(SEEDS)('search reports found exactly when present (seed %i)', (seed) => {
    const input = makeInput('bst-search', seed);
    const last = byId('bst-search').run(input).at(-1)!;
    expect(last.explain.includes('found it')).toBe((input.keys as number[]).includes(input.value as number));
  });
  it('handles an empty starting tree', () => {
    const out = inorderKeys(finalState(byId('bst-insert').run(makeInput('bst-insert', undefined, { keys: '' }))));
    expect(out).toEqual([45]);
  });
});

describe('AVL', () => {
  const balanced = (s: TreeState): boolean => {
    const check = (id: number | null): boolean => {
      if (id === null) return true;
      const n = s.nodes[id];
      return Math.abs(heightOf(s, n.children[0]) - heightOf(s, n.children[1])) <= 1 && check(n.children[0]) && check(n.children[1]);
    };
    return s.roots.every(check);
  };
  it.each(SEEDS)('insert stays balanced and sorted (seed %i)', (seed) => {
    const input = makeInput('avl-insert', seed);
    const s = finalState(byId('avl-insert').run(input));
    expect(balanced(s)).toBe(true);
    expect(inorderKeys(s)).toEqual([...new Set([...(input.keys as number[]), input.value as number])].sort((a, b) => a - b));
  });
  it.each(SEEDS)('delete stays balanced and sorted (seed %i)', (seed) => {
    const input = makeInput('avl-delete', seed);
    const s = finalState(byId('avl-delete').run(input));
    expect(balanced(s)).toBe(true);
    expect(inorderKeys(s)).toEqual(distinct(input.keys as number[]).filter((k) => k !== input.value).sort((a, b) => a - b));
  });
  it('a sorted insert sequence is still logarithmic', () => {
    const keys = Array.from({ length: 14 }, (_, i) => i + 1).join(', ');
    const s = finalState(byId('avl-insert').run(makeInput('avl-insert', undefined, { keys, value: '15' })));
    expect(heightOf(s, s.roots[0])).toBeLessThanOrEqual(5);
  });
  it('performs a rotation on the default input', () => {
    const steps = byId('avl-insert').run(makeInput('avl-insert', undefined, { keys: '10, 20', value: '30' }));
    expect(steps.at(-1)!.stats.rotations).toBe(1);
  });
});

describe('red-black tree', () => {
  /** Checks the red-black rules; returns the black height or -1 on a violation. */
  const blackHeight = (s: TreeState, id: number | null, parentRed = false): number => {
    if (id === null) return 1;
    const n = s.nodes[id];
    const red = n.color === 'red';
    if (red && parentRed) return -1;
    const l = blackHeight(s, n.children[0], red);
    const r = blackHeight(s, n.children[1], red);
    if (l < 0 || r < 0 || l !== r) return -1;
    return l + (red ? 0 : 1);
  };
  it.each(SEEDS)('satisfies every rule (seed %i)', (seed) => {
    const input = makeInput('red-black-insert', seed);
    const s = finalState(byId('red-black-insert').run(input));
    expect(s.nodes[s.roots[0]].color).toBe('black');
    expect(blackHeight(s, s.roots[0])).toBeGreaterThan(0);
    expect(inorderKeys(s)).toEqual([...new Set([...(input.keys as number[]), input.value as number])].sort((a, b) => a - b));
  });
  it('holds for a long ascending sequence', () => {
    const keys = Array.from({ length: 14 }, (_, i) => i + 1).join(', ');
    const s = finalState(byId('red-black-insert').run(makeInput('red-black-insert', undefined, { keys, value: '15' })));
    expect(blackHeight(s, s.roots[0])).toBeGreaterThan(0);
  });
});

describe('traversals', () => {
  /** Visit order read from the final `#k` captions. */
  const order = (id: string) => {
    const s = finalState(byId(id).run(makeInput(id)));
    return Object.values(s.nodes).sort((a, b) => Number(a.sub!.slice(1)) - Number(b.sub!.slice(1))).map((n) => Number(n.label));
  };
  it('produces the textbook orders for the default tree', () => {
    expect(order('inorder-traversal')).toEqual([20, 30, 40, 50, 60, 70, 80]);
    expect(order('preorder-traversal')).toEqual([50, 30, 20, 40, 70, 60, 80]);
    expect(order('postorder-traversal')).toEqual([20, 40, 30, 60, 80, 70, 50]);
    expect(order('levelorder-traversal')).toEqual([50, 30, 70, 20, 40, 60, 80]);
  });
});

describe('heaps', () => {
  const arrayOf = (id: string, override: Record<string, string> = {}, seed?: number) => finalState(byId(id).run(makeInput(id, seed, override))).array as number[];
  /** True when the array satisfies the heap property. */
  const isHeap = (a: number[], min: boolean) => a.every((v, i) => i === 0 || (min ? a[(i - 1) >> 1] <= v : a[(i - 1) >> 1] >= v));
  it.each(SEEDS)('insert keeps the heap property (seed %i)', (seed) => {
    for (const kind of ['min', 'max']) {
      const a = arrayOf('heap-insert', { kind }, seed);
      expect(isHeap(a, kind === 'min')).toBe(true);
    }
  });
  it.each(SEEDS)('extract removes the top and stays a heap (seed %i)', (seed) => {
    for (const kind of ['min', 'max']) {
      const input = makeInput('heap-extract', seed, { kind });
      const keys = input.keys as number[];
      const a = arrayOf('heap-extract', { kind }, seed);
      expect(isHeap(a, kind === 'min')).toBe(true);
      expect(a.length).toBe(keys.length - 1);
      expect([...a].sort((x, y) => x - y)).toEqual([...keys].sort((x, y) => x - y).slice(kind === 'min' ? 1 : 0, kind === 'min' ? undefined : -1));
    }
  });
  it.each(SEEDS)('build turns any array into a heap (seed %i)', (seed) => {
    for (const kind of ['min', 'max']) {
      const a = arrayOf('heap-build', { kind }, seed);
      expect(isHeap(a, kind === 'min')).toBe(true);
    }
  });
  it('extract on an empty heap explains itself', () => {
    expect(byId('heap-extract').run(makeInput('heap-extract', undefined, { keys: '' })).at(-1)!.explain).toContain('empty');
  });
});

describe('trie', () => {
  it('search finds stored words and rejects prefixes and absent words', () => {
    const run = (word: string) => byId('trie-search').run(makeInput('trie-search', undefined, { word })).at(-1)!.explain;
    expect(run('car')).toContain('found');
    expect(run('ca')).toContain('only a prefix');
    expect(run('cow')).toContain('not in the trie');
  });
  it('insert adds a new path and marks its end', () => {
    const s = finalState(byId('trie-insert').run(makeInput('trie-insert', undefined, { word: 'cane' })));
    const labels = Object.values(s.nodes).map((n) => n.label).join('');
    expect(labels).toContain('e');
    expect(Object.values(s.nodes).filter((n) => n.sub === 'word').length).toBe(6);
  });
});

describe('union-find', () => {
  it('ends with the expected number of sets', () => {
    const steps = byId('union-find').run(makeInput('union-find'));
    expect(steps.at(-1)!.explain).toContain('1 set');
  });
  it('rejects a bad pair', () => {
    expect(() => byId('union-find').run(makeInput('union-find', undefined, { ops: '0-9' }))).toThrow(/not a valid pair/);
  });
});

describe('segment tree', () => {
  const arr = [5, 3, 8, 6, 2, 7, 4, 1];
  it('builds a root holding the total', () => {
    const s = finalState(byId('segtree-build').run(makeInput('segtree-build')));
    expect(s.nodes[1].label).toBe(String(arr.reduce((a, b) => a + b)));
  });
  it.each([[0, 7], [2, 6], [3, 3], [1, 4]])('range sum %i..%i matches a direct sum', (from, to) => {
    const steps = byId('segtree-query').run(makeInput('segtree-query', undefined, { from: String(from), to: String(to) }));
    expect(steps.at(-1)!.explain).toContain(`is ${arr.slice(from, to + 1).reduce((a, b) => a + b)}.`);
  });
  it('update changes the root sum', () => {
    const s = finalState(byId('segtree-update').run(makeInput('segtree-update', undefined, { index: '3', value: '10' })));
    expect(s.nodes[1].label).toBe(String(arr.reduce((a, b) => a + b) - 6 + 10));
  });
  it('rejects a query outside the array', () => {
    expect(() => byId('segtree-query').run(makeInput('segtree-query', undefined, { from: '2', to: '11' }))).toThrow(/Use 0/);
  });
});
