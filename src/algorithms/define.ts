/** Generic definer for algorithms driven by the form input (DP, strings, classics). */
import type { AlgorithmDef, Complexity, Family, FieldSpec, FormInput, ScaleSpec, Step, ViewKind } from '../core/step';
import { theoryFor } from './theory';

/** Everything a form-driven algorithm file provides. */
export interface FormSpec<S> {
  id: string;
  name: string;
  family: Family;
  group: string;
  summary: string;
  complexity: Complexity;
  pseudocode: string[];
  form: FieldSpec[];
  randomize?: (seed: number) => Record<string, string>;
  randomLabel?: string;
  view: ViewKind;
  run: (input: FormInput) => Step<S>[];
  /** Inputs of growing size for the Complexity Lab. */
  scale?: ScaleSpec<FormInput>;
}

/**
 * Builds an {@link AlgorithmDef} whose input is a generic form.
 * @param s - algorithm fields
 * @returns a registry-ready definition
 */
export function defineForm<S>(s: FormSpec<S>): AlgorithmDef<FormInput, S> {
  return {
    id: s.id,
    name: s.name,
    family: s.family,
    group: s.group,
    summary: s.summary,
    complexity: s.complexity,
    pseudocode: s.pseudocode,
    theory: theoryFor(s.id),
    input: { kind: 'form', maxSize: 100, defaultSize: 0, form: s.form, randomize: s.randomize, randomLabel: s.randomLabel },
    run: s.run,
    view: s.view,
    scale: s.scale,
  };
}
