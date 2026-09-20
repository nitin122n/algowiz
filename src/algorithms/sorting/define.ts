/** Factory that fills the boilerplate shared by every sorting algorithm definition. */
import type { AlgorithmDef, ArrayState, Complexity, Step } from '../../core/step';
import { theoryFor } from '../theory';

/** Fields a sorting algorithm file must provide. */
export interface SortSpec {
  id: string;
  name: string;
  summary: string;
  complexity: Complexity;
  pseudocode: string[];
  /** Largest input size; small for algorithms whose step count explodes (bogo). */
  maxSize?: number;
  /** Default size for the random generator. */
  defaultSize?: number;
  /** Records the run. */
  run: (input: number[]) => Step<ArrayState>[];
}

/**
 * Builds a full {@link AlgorithmDef} for a sorting algorithm.
 * @param spec - the algorithm-specific fields
 * @returns a registry-ready definition using the bars view
 */
export function defineSort(spec: SortSpec): AlgorithmDef<number[], ArrayState> {
  const { maxSize = 60, defaultSize = 20, ...rest } = spec;
  return {
    ...rest,
    family: 'sorting',
    view: 'bars',
    theory: theoryFor(spec.id),
    input: { kind: 'array', maxSize, defaultSize },
  };
}
