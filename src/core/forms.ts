/** Parsing, defaults, and validation for the generic input form (`InputSpec.kind === 'form'`). */
import type { AlgorithmDef, FieldSpec, FormInput } from './step';
import { parseNumbers } from './random';

/** Thrown by algorithms when the input is well-formed but not usable (bad edge list, unsolvable board). */
export class InputError extends Error {}

/**
 * Raw text for every field of an algorithm's form, using each field's default.
 * @param def - algorithm definition with a form spec
 * @returns a record from field key to its default text
 */
export function defaultRaw(def: AlgorithmDef<any, any>): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const f of def.input.form ?? []) raw[f.key] = String(f.default);
  return raw;
}

/**
 * Parses one field.
 * @param f - field spec
 * @param text - what the user typed
 * @returns the parsed value or an error message naming the field
 */
function parseOne(f: FieldSpec, text: string): { ok: true; value: number[] | number | string } | { ok: false; error: string } {
  switch (f.type) {
    case 'numbers': {
      if (text.trim() === '') return { ok: true, value: [] };
      const r = parseNumbers(text);
      if (!r.ok) return { ok: false, error: `${f.label}: ${r.error}` };
      if (f.max !== undefined && r.values.length > f.max) return { ok: false, error: `${f.label}: use at most ${f.max} numbers.` };
      return { ok: true, value: r.values };
    }
    case 'int': {
      const t = text.trim();
      if (t === '' || !Number.isInteger(Number(t))) return { ok: false, error: `${f.label} must be a whole number.` };
      const n = Number(t);
      if (f.min !== undefined && n < f.min) return { ok: false, error: `${f.label} must be at least ${f.min}.` };
      if (f.max !== undefined && n > f.max) return { ok: false, error: `${f.label} must be at most ${f.max}.` };
      return { ok: true, value: n };
    }
    case 'text':
      if (f.maxLength !== undefined && text.length > f.maxLength) return { ok: false, error: `${f.label}: use at most ${f.maxLength} characters.` };
      return { ok: true, value: text };
    case 'select':
      return { ok: true, value: text };
  }
}

/**
 * Validates every field and builds the typed input.
 * @param fields - form spec
 * @param raw - field text keyed by field key
 * @returns the input record, or the first error
 */
export function buildForm(fields: FieldSpec[], raw: Record<string, string>): { ok: true; input: FormInput } | { ok: false; error: string } {
  const input: FormInput = {};
  for (const f of fields) {
    const r = parseOne(f, raw[f.key] ?? String(f.default));
    if (!r.ok) return r;
    input[f.key] = r.value;
  }
  return { ok: true, input };
}

/**
 * Reads a numbers field from a form input.
 * @param input - the parsed form
 * @param key - field key
 * @returns the number array (empty if the field is not numbers)
 */
export const nums = (input: FormInput, key: string): number[] => (Array.isArray(input[key]) ? (input[key] as number[]) : []);
/** Reads an integer field. @param input - parsed form @param key - field key */
export const int = (input: FormInput, key: string): number => Number(input[key]);
/** Reads a text or select field. @param input - parsed form @param key - field key */
export const str = (input: FormInput, key: string): string => String(input[key] ?? '');
