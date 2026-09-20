/** Input controls: fields for whatever an algorithm needs, plus presets, size, and a random button. */
import { Shuffle } from '@phosphor-icons/react';
import type { AlgorithmDef, FieldSpec } from '../core/step';
import type { InputPreset } from '../core/random';
import { fieldsOf } from './inputs';

/** Preset buttons in display order (array algorithms). */
const PRESETS: Array<{ id: InputPreset; label: string }> = [
  { id: 'random', label: 'Random' },
  { id: 'sorted', label: 'Sorted' },
  { id: 'reversed', label: 'Reversed' },
  { id: 'nearly', label: 'Nearly sorted' },
  { id: 'unique', label: 'Few unique' },
];

/** Props for {@link InputPanel}. */
interface InputPanelProps {
  def: AlgorithmDef<any, any>;
  /** Field text keyed by field key. */
  raw: Record<string, string>;
  preset: InputPreset | 'custom';
  size: number;
  /** Validation or run error, or null when the input is fine. */
  error: string | null;
  onField: (key: string, value: string) => void;
  onPreset: (p: InputPreset) => void;
  onSize: (n: number) => void;
  onRandom: () => void;
}

/** True for fields that should take the full row (long text or number lists). */
const isWide = (f: FieldSpec) => f.type === 'numbers' || (f.type === 'text' && (f.maxLength ?? 0) > 20);

/**
 * Renders the form. Labels sit above fields, help text and the single error message below.
 * @param props - field values and change handlers
 */
export function InputPanel(p: InputPanelProps) {
  const { input } = p.def;
  const fields = fieldsOf(p.def);
  const legacy = input.kind !== 'form';
  const isList = input.kind === 'list';
  const help = fields.map((f) => ('help' in f ? f.help : undefined)).find(Boolean);
  return (
    <section className="inputs" aria-label="Input">
      <div className="fields">
        {fields.map((f) => (
          <div className="field" data-wide={isWide(f)} key={f.key}>
            <label htmlFor={`f-${f.key}`}>{f.label}</label>
            {f.type === 'select' ? (
              <select id={`f-${f.key}`} className="text-input" value={p.raw[f.key] ?? f.default} onChange={(e) => p.onField(f.key, e.target.value)}>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                id={`f-${f.key}`}
                className="text-input mono"
                inputMode={f.type === 'int' ? 'numeric' : undefined}
                value={p.raw[f.key] ?? ''}
                onChange={(e) => p.onField(f.key, e.target.value)}
                spellCheck={false}
                aria-invalid={p.error !== null}
                aria-describedby={`h-${f.key}`}
              />
            )}
          </div>
        ))}
      </div>
      {p.error ? (
        <p className="field-error" role="alert">{p.error}</p>
      ) : (
        help && <p className="field-help">{help}</p>
      )}
      <div className="input-actions">
        {legacy && (
          <label className="size">
            <span>Size {p.size}</span>
            <input type="range" min={isList ? 0 : 3} max={input.maxSize} value={p.size} style={{ ['--p' as string]: `${(100 * ((p.size) - (isList ? 0 : 3))) / Math.max((input.maxSize) - (isList ? 0 : 3), 1)}%` }} onChange={(e) => p.onSize(Number(e.target.value))} />
          </label>
        )}
        <div className="presets" role="group" aria-label="Generate data">
          {legacy ? (
            (isList ? PRESETS.slice(0, 1) : PRESETS).map((pr) => (
              <button key={pr.id} className="chip-btn" data-on={p.preset === pr.id} onClick={() => p.onPreset(pr.id)}>
                {pr.id === 'random' && <Shuffle size={15} weight="bold" />}
                {pr.label}
              </button>
            ))
          ) : (
            input.randomize && (
              <button className="chip-btn" onClick={p.onRandom}>
                <Shuffle size={15} weight="bold" />
                {input.randomLabel ?? 'Random'}
              </button>
            )
          )}
        </div>
      </div>
    </section>
  );
}
