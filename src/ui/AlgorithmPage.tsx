/** The main page for one algorithm: header, inputs, stage, playback dock, and side panels. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildForm, defaultRaw, InputError } from '../core/forms';
import { growthOf } from '../core/growth';
import { makeArray, parseNumbers, type InputPreset } from '../core/random';
import { pitchFor, tone } from '../core/sound';
import type { AlgorithmDef, Step } from '../core/step';
import { hrefFor, type Route } from '../core/routes';
import { StageView } from '../views/StageView';
import { Legend } from '../views/Legend';
import { familyMeta } from './family';
import { displayName } from '../seo/meta';
import { InputPanel } from './InputPanel';
import { buildInput, fieldsOf, kindsUsed, stepBadge } from './inputs';
import { PlayerDock } from './PlayerDock';
import { Panels } from './Panels';
import { useShortcuts } from './useShortcuts';
import { useArrayMode } from './useArrayMode';
import { trackIds } from '../core/identity';
import { stepDelayMs } from '../core/player';
import { ChartBar, SquaresFour } from '@phosphor-icons/react';
import { usePlayer } from './usePlayer';

/** Props for {@link AlgorithmPage}. */
interface AlgorithmPageProps {
  def: AlgorithmDef<any, any>;
  /** State decoded from the URL when the page mounts. */
  initial: Route;
}

/**
 * Picks a default search target that is present but not dead center, so binary-style searches
 * take several visible steps instead of hitting on the first probe.
 * @param values - the array being searched
 * @returns a value present in the array, or 0 when empty
 */
function middleValue(values: number[]): number {
  if (values.length === 0) return 0;
  return [...values].sort((a, b) => a - b)[Math.floor(values.length * 0.8)];
}

/**
 * Builds the starting field text from defaults, overridden by whatever the URL carries.
 * @param def - the algorithm
 * @param initial - URL state at mount
 */
function initialRaw(def: AlgorithmDef<any, any>, initial: Route): Record<string, string> {
  if (def.input.kind === 'form') return { ...defaultRaw(def), ...(initial.f ?? {}) };
  const seedValues = makeArray('random', def.input.defaultSize, 7);
  return {
    text: initial.q?.split(',').join(', ') ?? seedValues.join(', '),
    target: String(initial.t ?? middleValue(seedValues)),
    value: String(initial.v ?? 42),
    index: String(initial.i ?? 2),
  };
}

/** Cost class of a complexity string, for tinting the header pills. */
const costOf = (s: string) => growthOf(s)?.cost ?? 1;

/**
 * Owns the form state, runs the algorithm, and lays out the visualization.
 * The component is remounted (via `key`) when the algorithm changes, so state always starts fresh.
 * @param props - algorithm and the URL state at mount
 */
export function AlgorithmPage({ def, initial }: AlgorithmPageProps) {
  const spec = def.input;
  const fam = familyMeta(def.family);
  const [raw, setRaw] = useState(() => initialRaw(def, initial));
  const [preset, setPreset] = useState<InputPreset | 'custom'>(initial.q ? 'custom' : 'random');
  const [size, setSize] = useState(spec.defaultSize);
  const [seed, setSeed] = useState(7);
  const [sound, setSound] = useState(false);

  /** Updates one field and marks the data as custom. */
  const setField = (key: string, value: string) => {
    setRaw((r) => ({ ...r, [key]: value }));
    if (key === 'text') setPreset('custom');
  };

  const built = useMemo(() => {
    if (spec.kind === 'form') return buildForm(spec.form ?? [], raw);
    return buildInput(spec, { text: raw.text ?? '', target: raw.target ?? '', value: raw.value ?? '', index: raw.index ?? '' });
  }, [spec, raw]);

  // A new run for valid input; run errors (a bad edge list, an unsolvable board) become messages.
  const outcome = useMemo((): { steps: Step<any>[] } | { error: string } => {
    if (!built.ok) return { error: built.error };
    try {
      return { steps: def.run(built.input) };
    } catch (e) {
      return { error: e instanceof InputError ? e.message : 'This input could not be run. Check the values and try again.' };
    }
  }, [def, built]);

  // Keep showing the last good run while the user is mid-edit with invalid input.
  const good = useRef<Step<any>[]>([]);
  const fresh = 'steps' in outcome ? outcome.steps : null;
  if (fresh) good.current = fresh;
  const steps = good.current;
  const error = 'error' in outcome ? outcome.error : null;

  const player = usePlayer(steps.length, initial.s ?? 0);
  const { seek, pause } = player;
  useShortcuts(player);

  // A new run starts from step 0 (but keep the step from the URL on first mount).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    pause();
    seek(0);
  }, [fresh, pause, seek]);

  /** Replaces the array with generated data for a preset (array and list algorithms). */
  const regenerate = (p: InputPreset, n: number, s: number) => {
    const values = makeArray(p, n, s);
    setRaw((r) => ({ ...r, text: values.join(', '), target: String(middleValue(values)) }));
    setPreset(p);
  };

  /** New random values for form algorithms, from a fresh seed. */
  const randomForm = () => {
    const s = seed + 1;
    setSeed(s);
    setRaw((r) => ({ ...r, ...spec.randomize?.(s) }));
  };

  // Pathfinding boards: clicking a cell adds or removes a wall.
  const editsWalls = spec.kind === 'form' && !!spec.form?.some((f) => f.key === 'walls');
  const toggleCell = editsWalls
    ? (i: number) => {
        const cur = parseNumbers(raw.walls ?? '');
        const set = new Set(cur.ok ? cur.values : []);
        if (set.has(i)) set.delete(i);
        else set.add(i);
        setField('walls', [...set].sort((a, b) => a - b).join(', '));
      }
    : undefined;

  // Keep the URL in sync so any state can be shared. Debounced and skipped during playback,
  // because Safari throttles history.replaceState.
  useEffect(() => {
    if (player.playing) return;
    /** Writes the shareable state into the URL after a short pause. */
    const id = window.setTimeout(() => {
      try {
        const legacy = spec.kind !== 'form';
        const defaults = spec.kind === 'form' ? defaultRaw(def) : {};
        const changed = spec.kind === 'form' ? Object.fromEntries(Object.entries(raw).filter(([k, v]) => v !== defaults[k])) : undefined;
        history.replaceState(
          null,
          '',
          hrefFor({
            id: def.id,
            q: legacy && built.ok ? raw.text?.split(/[\s,;]+/).filter(Boolean).join(',') : undefined,
            t: spec.kind === 'array+target' && Number.isInteger(Number(raw.target)) ? Number(raw.target) : undefined,
            v: spec.fields?.includes('value') && Number.isInteger(Number(raw.value)) ? Number(raw.value) : undefined,
            i: spec.fields?.includes('index') && Number.isInteger(Number(raw.index)) ? Number(raw.index) : undefined,
            f: changed,
            s: player.index,
          }),
        );
      } catch {
        /* sharing state is a convenience; ignore browsers that refuse */
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [def, spec, built.ok, raw, player.index, player.playing]);

  const step = steps[player.index] ?? steps[0];

  // Optional sound: pitch follows the value on the first compared, moved, or found element.
  useEffect(() => {
    if (!sound || !step) return;
    const s = step.state as { array?: unknown };
    const hit = step.marks.find((m) => ['compare', 'swap', 'found', 'pivot', 'insert', 'visited', 'path'].includes(m.kind));
    if (!hit) return;
    if (Array.isArray(s.array) && typeof s.array[0] === 'number') {
      const arr = s.array as number[];
      tone(pitchFor(arr[hit.index] ?? arr[0], Math.min(...arr), Math.max(...arr)));
    } else tone(260 + (hit.index % 12) * 55);
  }, [sound, step]);

  const kinds = useMemo(() => kindsUsed(steps), [steps]);
  const [arrayMode, setArrayMode] = useArrayMode();
  // Element identities across the run, so swapped values slide instead of jumping.
  const ids = useMemo(() => (def.view === 'bars' ? trackIds(steps.map((s) => (s.state as { array: number[] }).array)) : null), [def.view, steps]);
  // Slides finish a little before the next step arrives.
  const moveMs = Math.round(Math.min(340, Math.max(70, stepDelayMs(player.speed) * 0.85)));
  const badge = stepBadge(step, player.index, steps.length);
  const target = (step.state as { target?: number }).target;
  const FamIcon = fam.Icon;

  return (
    <div className="page">
      <div className="workspace">
        <header className="page-head">
          <span className="fam-tile" aria-hidden="true"><FamIcon size={26} weight="duotone" /></span>
          <div className="head-text">
            <h1>{displayName(def)}</h1>
            <p className="head-sub">{def.summary}</p>
          </div>
          <ul className="chips" aria-label="Complexity">
            {(['best', 'average', 'worst', 'space'] as const).map((k) => (
              <li key={k} data-cost={k === 'space' ? 'none' : costOf(def.complexity[k])}>
                <span>{k === 'average' ? 'Avg' : k[0].toUpperCase() + k.slice(1)}</span>
                {def.complexity[k]}
              </li>
            ))}
          </ul>
        </header>

        <InputPanel def={def} raw={raw} preset={preset} size={size} error={error} onField={setField} onRandom={randomForm} onPreset={(p) => {
          const s = p === preset ? seed + 1 : seed;
          setSeed(s);
          regenerate(p, size, s);
        }} onSize={(n) => {
          setSize(n);
          regenerate(preset === 'custom' ? 'random' : preset, n, seed);
        }} />

        <section className="stage" aria-label="Visualization" style={{ ['--move' as string]: `${moveMs}ms` }}>
          <div className="stage-head">
            <span className="step-count">Step {player.index + 1} of {steps.length}</span>
            {badge && (
              <span className="step-badge" data-mark={badge.kind}>
                <i aria-hidden="true" />
                {badge.label}
              </span>
            )}
            {target !== undefined && <span className="target-pill">Target {target}</span>}
            {def.view === 'bars' && (
              <div className="seg seg-sm view-toggle" role="radiogroup" aria-label="Draw the array as">
                <button role="radio" aria-checked={arrayMode === 'bars'} data-on={arrayMode === 'bars'} onClick={() => setArrayMode('bars')}>
                  <ChartBar size={15} weight="bold" aria-hidden="true" /> Bars
                </button>
                <button role="radio" aria-checked={arrayMode === 'cells'} data-on={arrayMode === 'cells'} onClick={() => setArrayMode('cells')}>
                  <SquaresFour size={15} weight="bold" aria-hidden="true" /> Array
                </button>
              </div>
            )}
          </div>
          <p className="explain" aria-live="polite" key={player.index}>{step.explain}</p>
          <div className="stage-body">
            <StageView def={def} step={step} onToggleCell={toggleCell} ids={ids?.[player.index]} arrayMode={arrayMode} />
          </div>
          {toggleCell && <p className="stage-hint">Click any cell on the board to add or remove a wall.</p>}
          <Legend kinds={kinds} />
        </section>

        <PlayerDock player={player} length={steps.length} sound={sound} onSound={setSound} />
      </div>
      <Panels def={def} steps={steps} index={player.index} onSeek={player.seek} input={built.ok ? built.input : null} />
    </div>
  );
}

/** Field list re-exported for tests that need the labels. */
export { fieldsOf };
