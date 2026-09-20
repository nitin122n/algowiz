/** Parsing and validation of the input form into the exact shape each algorithm expects. */
import type { AlgorithmDef, FieldSpec, InputSpec, ListInput, MarkKind, SearchInput, Step } from '../core/step';
import { buildForm, defaultRaw } from '../core/forms';
import { makeArray, parseNumbers } from '../core/random';

/** Result of validating the form. */
export type Built = { ok: true; input: unknown; values: number[] } | { ok: false; error: string };

/** Raw form values, all strings as typed by the user. */
export interface RawForm {
  text: string;
  target: string;
  value: string;
  index: string;
}

/**
 * Parses one integer field.
 * @param raw - text typed by the user
 * @param label - field name used in the error message
 * @returns the number, or an error message
 */
function parseField(raw: string, label: string): { ok: true; n: number } | { ok: false; error: string } {
  const t = raw.trim();
  if (t === '' || !Number.isInteger(Number(t))) return { ok: false, error: `${label} must be a whole number.` };
  return { ok: true, n: Number(t) };
}

/**
 * Validates the form and builds the algorithm input.
 * @param spec - the algorithm's input spec
 * @param form - raw field values
 * @returns the input and parsed values, or the first validation error
 */
export function buildInput(spec: InputSpec, form: RawForm): Built {
  let values: number[] = [];
  if (spec.kind === 'list' && form.text.trim() === '') {
    values = [];
  } else {
    const parsed = parseNumbers(form.text);
    if (!parsed.ok) return parsed;
    values = parsed.values;
  }
  if (values.length > spec.maxSize) return { ok: false, error: `This algorithm accepts at most ${spec.maxSize} numbers (you entered ${values.length}).` };

  if (spec.kind === 'array') return { ok: true, input: values, values };

  if (spec.kind === 'array+target') {
    const t = parseField(form.target, 'Target');
    if (!t.ok) return t;
    const array = spec.needsSorted ? [...values].sort((a, b) => a - b) : values;
    return { ok: true, input: { array, target: t.n } satisfies SearchInput, values };
  }

  const v = spec.fields?.includes('value') ? parseField(form.value, 'Value') : { ok: true as const, n: 0 };
  if (!v.ok) return v;
  const i = spec.fields?.includes('index') ? parseField(form.index, 'Position') : { ok: true as const, n: 0 };
  if (!i.ok) return i;
  return { ok: true, input: { list: values, value: v.n, index: i.n } satisfies ListInput, values };
}

/**
 * Lists the mark kinds that appear anywhere in a run, in a stable display order.
 * @param steps - the recorded run
 * @returns kinds for the legend
 */
export function kindsUsed(steps: Step<unknown>[]): MarkKind[] {
  const order: MarkKind[] = ['compare', 'swap', 'pivot', 'active', 'pointer', 'frontier', 'range', 'insert', 'delete', 'visited', 'sorted', 'path', 'found', 'notfound'];
  const seen = new Set<MarkKind>();
  for (const s of steps) for (const m of s.marks) seen.add(m.kind);
  return order.filter((k) => seen.has(k));
}

/**
 * Builds the default typed input for any algorithm, exactly as the app does on first load.
 * Used by the landing-page previews and the race page.
 * @param def - the algorithm
 * @param size - element count override for array algorithms
 */
export function defaultInput(def: AlgorithmDef<any, any>, size?: number): unknown {
  const spec = def.input;
  if (spec.kind === 'form') {
    const built = buildForm(spec.form ?? [], defaultRaw(def));
    if (!built.ok) throw new Error(`${def.id}: ${built.error}`);
    return built.input;
  }
  const n = size ?? spec.defaultSize;
  const arr = makeArray('random', n, 7);
  if (spec.kind === 'array') return arr;
  if (spec.kind === 'array+target') {
    const array = spec.needsSorted ? [...arr].sort((a, b) => a - b) : arr;
    return { array, target: array[Math.floor(array.length * 0.8)] } satisfies SearchInput;
  }
  return { list: arr, value: 42, index: Math.min(2, n) } satisfies ListInput;
}

/** Number of a step's mark kind to a short label for the stage header. */
const BADGES: Array<[MarkKind, string]> = [
  ['found', 'Found'], ['path', 'Path'], ['swap', 'Move'], ['delete', 'Remove'], ['pivot', 'Pivot'], ['compare', 'Compare'],
  ['insert', 'Insert'], ['sorted', 'Sorted'], ['frontier', 'Explore'], ['visited', 'Visit'], ['active', 'Focus'],
];

/**
 * Chooses the badge that names what this step is doing.
 * @param step - the current step
 * @param index - its index in the run
 * @param length - run length
 * @returns a label and the mark kind whose color the badge uses, or null
 */
export function stepBadge(step: Step<unknown>, index: number, length: number): { label: string; kind: MarkKind | 'none' } | null {
  if (index === 0) return { label: 'Start', kind: 'none' };
  if (index === length - 1) return { label: 'Done', kind: 'found' };
  for (const [kind, label] of BADGES) if (step.marks.some((m) => m.kind === kind)) return { label, kind };
  return null;
}

/**
 * Describes every input field of an algorithm as form fields, including the legacy array, target, and list kinds.
 * @param def - the algorithm
 */
export function fieldsOf(def: AlgorithmDef<any, any>): FieldSpec[] {
  const spec = def.input;
  if (spec.kind === 'form') return spec.form ?? [];
  const numbers: FieldSpec = { key: 'text', label: spec.kind === 'list' ? 'List values' : 'Numbers', type: 'numbers', default: '', max: spec.maxSize, help: `Separate with commas. Up to ${spec.maxSize} numbers.${spec.needsSorted ? ' The array is sorted for you before the search.' : ''}` };
  const out: FieldSpec[] = [numbers];
  if (spec.kind === 'array+target') out.push({ key: 'target', label: 'Target', type: 'int', default: 0 });
  if (spec.fields?.includes('value')) out.push({ key: 'value', label: 'Value', type: 'int', default: 42 });
  if (spec.fields?.includes('index')) out.push({ key: 'index', label: 'Position', type: 'int', default: 2 });
  return out;
}
