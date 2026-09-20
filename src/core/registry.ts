/** Lookup helpers over a list of algorithm definitions. */
import type { AlgorithmDef, Family } from './step';

/** Read-only view over registered algorithms. */
export interface Registry {
  /** All algorithms in registration order. */
  all: AlgorithmDef<any, any>[];
  /**
   * Finds one algorithm.
   * @param id - algorithm id
   * @returns the definition, or undefined when unknown
   */
  get(id: string): AlgorithmDef<any, any> | undefined;
  /**
   * Lists algorithms of one family.
   * @param family - family to filter by
   * @returns matching definitions in registration order
   */
  byFamily(family: Family): AlgorithmDef<any, any>[];
}

/**
 * Builds a registry and rejects duplicate ids early.
 * @param defs - every algorithm definition
 * @returns the registry
 */
export function createRegistry(defs: AlgorithmDef<any, any>[]): Registry {
  const map = new Map<string, AlgorithmDef<any, any>>();
  for (const d of defs) {
    if (map.has(d.id)) throw new Error(`Duplicate algorithm id: ${d.id}`);
    map.set(d.id, d);
  }
  return {
    all: defs,
    get: (id) => map.get(id),
    byFamily: (family) => defs.filter((d) => d.family === family),
  };
}
