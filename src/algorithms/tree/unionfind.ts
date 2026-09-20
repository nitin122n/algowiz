import { int, str } from '../../core/forms';
import { InputError } from '../../core/forms';
import type { AlgorithmDef, FormInput, Mark, Step, TreeNode, TreeState } from '../../core/step';
import { Rec } from '../../core/tracer';
import { theoryFor } from '../theory';
import { mulberry32 } from '../../core/random';
import { shape, spread } from '../../core/scale';

/** Union-find (disjoint set forest) with union by rank and path compression, drawn as a forest. */
export const unionFind: AlgorithmDef<FormInput, TreeState> = {
  id: 'union-find',
  name: 'Union-Find (Disjoint Sets)',
  family: 'tree',
  group: 'Disjoint sets',
  summary: 'Keeps elements in trees; find follows parents to the root and flattens the path, union hangs the shorter tree under the taller.',
  complexity: { best: 'O(1)', average: 'O(α(n))', worst: 'O(α(n))', space: 'O(n)' },
  pseudocode: ['find(x): follow parent links up to the root', '  path compression: point every node on the path at the root', 'union(a, b): ra = find(a); rb = find(b)', '  if ra == rb: already together', '  else attach the lower-rank root under the higher-rank root'],
  theory: theoryFor('union-find'),
  input: {
    kind: 'form',
    maxSize: 100,
    defaultSize: 0,
    form: [
      { key: 'n', label: 'Elements', type: 'int', default: 8, min: 2, max: 12 },
      { key: 'ops', label: 'Unions', type: 'text', default: '0-1, 2-3, 0-2, 4-5, 6-7, 4-6, 0-4, 3-7', help: 'Pairs like 0-1, in order.', maxLength: 90 },
    ],
    randomize: (seed) => ({ n: '8', ops: Array.from({ length: 7 }, (_, i) => `${(seed * 3 + i * 5) % 8}-${(seed * 7 + i * 3 + 1) % 8}`).filter((s) => s.split('-')[0] !== s.split('-')[1]).join(', ') }),
  },
  view: 'tree',
  scale: {
    sizes: spread(2, 12),
    unit: 'elements',
    shapes: [shape('random', 'Random unions', 3), shape('chain', 'Unions along a chain')],
    make: (n, s, seed) => {
      const rnd = mulberry32(seed * 53 + n);
      const pairs = Array.from({ length: n - 1 }, (_, i) => (s === 'chain' ? `${i}-${i + 1}` : `${Math.floor(rnd() * n)}-${Math.floor(rnd() * n)}`));
      return { n, ops: pairs.join(', ') };
    },
    sizeOf: (i) => Number(i.n),
  },
  run(input): Step<TreeState>[] {
    const n = int(input, 'n');
    const pairs = str(input, 'ops').split(/[,;]+/).map((s) => s.trim()).filter(Boolean).map((s) => {
      const m = /^(\d+)\s*-\s*(\d+)$/.exec(s);
      if (!m || Number(m[1]) >= n || Number(m[2]) >= n) throw new InputError(`"${s}" is not a valid pair. Use two numbers from 0 to ${n - 1}, like 0-1.`);
      return [Number(m[1]), Number(m[2])] as const;
    });
    const parent = Array.from({ length: n }, (_, i) => i);
    const rank = Array(n).fill(0);
    const r = new Rec<TreeState>(['unions', 'finds']);
    /** Draws the forest. */
    const snap = (marks: Mark[], line: number, explain: string) => {
      const nodes: Record<number, TreeNode> = {};
      for (let i = 0; i < n; i++) nodes[i] = { label: String(i), children: [], sub: parent[i] === i ? `rank ${rank[i]}` : undefined };
      for (let i = 0; i < n; i++) if (parent[i] !== i) nodes[parent[i]].children.push(i);
      r.snap({ nodes, roots: parent.map((p, i) => (p === i ? i : -1)).filter((i) => i >= 0), binary: false, array: [...parent], arrayLabel: 'parent[ ]', arrayIsNodeIds: true }, marks, line, explain);
    };
    /** Finds the root of x, compressing the path and recording it. */
    const find = (x: number): number => {
      r.count('finds');
      const path = [x];
      while (parent[path[path.length - 1]] !== path[path.length - 1]) path.push(parent[path[path.length - 1]]);
      const root = path[path.length - 1];
      r.raise('memory', path.length);
      snap(path.map((index, k) => ({ kind: k === path.length - 1 ? ('found' as const) : ('compare' as const), index })), 0, `find(${x}): follow parents ${path.join(' → ')}; the root is ${root}.`);
      if (path.length > 2) {
        path.slice(0, -1).forEach((p) => (parent[p] = root));
        snap([{ kind: 'swap', index: root }, ...path.slice(0, -1).map((index) => ({ kind: 'swap' as const, index }))], 1, `Path compression: every node on the path now points straight at ${root}.`);
      }
      return root;
    };
    snap([], 0, `${n} elements, each in its own set.`);
    for (const [a, b] of pairs) {
      snap([{ kind: 'pivot', index: a }, { kind: 'pivot', index: b }], 2, `union(${a}, ${b}).`);
      const ra = find(a);
      const rb = find(b);
      if (ra === rb) {
        snap([{ kind: 'notfound', index: ra }], 3, `${a} and ${b} already share the root ${ra}: nothing to do.`);
        continue;
      }
      const [lo, hi] = rank[ra] < rank[rb] ? [ra, rb] : [rb, ra];
      parent[lo] = hi;
      if (rank[ra] === rank[rb]) rank[hi]++;
      r.count('unions');
      snap([{ kind: 'insert', index: lo }, { kind: 'found', index: hi }], 4, `Attach the root ${lo} (rank ${rank[lo]}) under ${hi}.`);
    }
    const sets = new Set(parent.map((_, i) => find(i))).size;
    snap([], 4, `Done: ${sets} set${sets === 1 ? '' : 's'} remain.`);
    return r.steps;
  },
};
