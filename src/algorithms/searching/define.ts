/** Factory that fills the boilerplate shared by every search algorithm definition. */
import type { AlgorithmDef, Complexity, SearchInput, SearchState, Step } from '../../core/step';
import { theoryFor } from '../theory';

/** Fields a search algorithm file must provide. */
export interface SearchSpec {
  id: string;
  name: string;
  summary: string;
  complexity: Complexity;
  pseudocode: string[];
  /** True when the array must be sorted; the shell sorts it before running. */
  needsSorted: boolean;
  /** Records the run. */
  run: (input: SearchInput) => Step<SearchState>[];
}

/**
 * Builds a full {@link AlgorithmDef} for a search algorithm.
 * @param spec - the algorithm-specific fields
 * @returns a registry-ready definition using the bars view
 */
export function defineSearch(spec: SearchSpec): AlgorithmDef<SearchInput, SearchState> {
  const { needsSorted, ...rest } = spec;
  return {
    ...rest,
    family: 'searching',
    view: 'bars',
    theory: theoryFor(spec.id),
    input: { kind: 'array+target', maxSize: 60, defaultSize: 15, needsSorted },
  };
}
