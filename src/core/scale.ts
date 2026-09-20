/**
 * Input generators of growing size for the Complexity Lab. Array, search, and list algorithms get a
 * recipe automatically; other families declare `scale` on their definitions.
 */
import { makeArray, mulberry32 } from './random';
import type { AlgorithmDef, ListInput, ScaleShape, ScaleSpec, SearchInput } from './step';

/**
 * Evenly spread integer sizes between two bounds.
 * @param min - smallest size
 * @param max - largest size
 * @param count - how many sizes at most
 * @returns sorted distinct sizes
 */
export function spread(min: number, max: number, count = 8): number[] {
  if (max <= min) return [min];
  const out = new Set<number>();
  for (let k = 0; k < count; k++) out.add(Math.round(min + ((max - min) * k) / (count - 1)));
  return [...out].sort((a, b) => a - b);
}

/** Shape shorthand. @param id - shape id @param label - legend text @param seeds - runs to average */
export const shape = (id: string, label: string, seeds = 1): ScaleShape => ({ id, label, seeds });

/** The three classic array shapes. */
const ARRAY_SHAPES = [shape('sorted', 'Sorted input'), shape('random', 'Random input', 3), shape('reversed', 'Reversed input')];

/**
 * Recipe for sorting-style algorithms that take a plain array.
 * @param maxSize - the algorithm's size limit
 */
function arrayScale(maxSize: number): ScaleSpec<number[]> {
  return {
    sizes: spread(Math.min(4, maxSize), Math.min(maxSize, 60)),
    unit: 'elements',
    shapes: ARRAY_SHAPES,
    make: (n, s, seed) => makeArray(s === 'sorted' ? 'sorted' : s === 'reversed' ? 'reversed' : 'random', n, seed * 7919 + n),
    sizeOf: (a) => a.length,
  };
}

/**
 * Recipe for searches: distinct sorted values, with the target present at a random spot or absent.
 * @param maxSize - the algorithm's size limit
 */
function searchScale(maxSize: number): ScaleSpec<SearchInput> {
  return {
    sizes: spread(4, Math.min(maxSize, 60)),
    unit: 'elements',
    shapes: [shape('present', 'Target present', 5), shape('absent', 'Target absent')],
    make: (n, s, seed) => {
      const array = Array.from({ length: n }, (_, i) => 3 * (i + 1));
      const rnd = mulberry32(seed * 104729 + n);
      return { array, target: s === 'absent' ? 3 * n + 1 : array[Math.floor(rnd() * n)] };
    },
    sizeOf: (i) => i.array.length,
  };
}

/** Recipe for linked-list operations: a list of n nodes, working at the middle. */
function listScale(maxSize: number): ScaleSpec<ListInput> {
  return {
    sizes: spread(1, maxSize),
    unit: 'nodes',
    shapes: [shape('random', 'Random list', 1)],
    make: (n, _s, seed) => ({ list: makeArray('random', n, seed + n), value: 42, index: Math.floor(n / 2) }),
    sizeOf: (i) => i.list.length,
  };
}

/**
 * The scaling recipe for an algorithm, if it has one.
 * @param def - the algorithm
 * @returns its declared recipe, an automatic one, or null
 */
export function scaleFor(def: AlgorithmDef<any, any>): ScaleSpec<any> | null {
  if (def.scale) return def.scale;
  const { kind, maxSize } = def.input;
  if (kind === 'array') return arrayScale(maxSize);
  if (kind === 'array+target') return searchScale(maxSize);
  if (kind === 'list') return listScale(maxSize);
  return null;
}
