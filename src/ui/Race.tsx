/** Race mode: run several sorting algorithms on the same data and watch them side by side. */
import { Shuffle, Trophy } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { SORTING } from '../algorithms/sorting';
import { makeArray, type InputPreset } from '../core/random';
import type { ArrayState, Step } from '../core/step';
import { BarsView } from '../views/BarsView';
import { PlayerDock } from './PlayerDock';
import { useShortcuts } from './useShortcuts';
import { usePlayer } from './usePlayer';
import { trackIds } from '../core/identity';
import { stepDelayMs } from '../core/player';
import { useArrayMode } from './useArrayMode';
import { ChartBar, SquaresFour } from '@phosphor-icons/react';

/** Sorts that fit a race: everything except bogo sort, which cannot handle more than five elements. */
const RACERS = SORTING.filter((d) => d.id !== 'bogo-sort');
/** Most algorithms that fit side by side. */
const MAX_RACERS = 4;
const PRESETS: Array<{ id: InputPreset; label: string }> = [
  { id: 'random', label: 'Random' },
  { id: 'sorted', label: 'Sorted' },
  { id: 'reversed', label: 'Reversed' },
  { id: 'nearly', label: 'Nearly sorted' },
  { id: 'unique', label: 'Few unique' },
];

/**
 * The race page. All racers share one player, so one step for everyone means one recorded step of work.
 * The algorithm that reaches its final step first wins; the counters show why.
 */
export function Race() {
  const [ids, setIds] = useState(['bubble-sort', 'insertion-sort', 'merge-sort', 'quick-sort']);
  const [preset, setPreset] = useState<InputPreset>('random');
  const [size, setSize] = useState(18);
  const [seed, setSeed] = useState(4);
  const data = useMemo(() => makeArray(preset, size, seed), [preset, size, seed]);
  const runs = useMemo(() => ids.map((id) => ({ def: RACERS.find((d) => d.id === id)!, steps: RACERS.find((d) => d.id === id)!.run(data) as Step<ArrayState>[] })).map((r) => ({ ...r, idTrack: trackIds(r.steps.map((s) => s.state.array)) })), [ids, data]);
  const longest = Math.max(...runs.map((r) => r.steps.length));
  const player = usePlayer(longest);
  useShortcuts(player);
  const { first } = player;
  const [arrayMode, setArrayMode] = useArrayMode();

  /** Adds or removes an algorithm from the race and restarts it. */
  const toggle = (id: string) => {
    setIds((cur) => (cur.includes(id) ? (cur.length > 2 ? cur.filter((x) => x !== id) : cur) : cur.length < MAX_RACERS ? [...cur, id] : cur));
    first();
  };
  /** Changes the data and restarts the race. */
  const regenerate = (p: InputPreset, n: number, s: number) => {
    setPreset(p);
    setSize(n);
    setSeed(s);
    first();
  };
  const finishers = runs.map((r) => r.steps.length).sort((a, b) => a - b);

  return (
    <div className="page race">
      <div className="workspace">
        <header className="page-head">
          <span className="fam-tile" aria-hidden="true"><Trophy size={26} weight="duotone" /></span>
          <div className="head-text">
            <h1>Sorting race</h1>
            <p className="head-sub">Pick two to four algorithms. They all sort the same data, one recorded step at a time.</p>
          </div>
        </header>

        <section className="inputs" aria-label="Race setup">
          <div className="racer-picks" role="group" aria-label="Algorithms in the race">
            {RACERS.map((d) => (
              <button key={d.id} className="chip-btn" data-on={ids.includes(d.id)} aria-pressed={ids.includes(d.id)} disabled={!ids.includes(d.id) && ids.length >= MAX_RACERS} onClick={() => toggle(d.id)}>
                {d.name.replace(' (simplified)', '')}
              </button>
            ))}
          </div>
          <div className="input-actions">
            <label className="size">
              <span>Size {size}</span>
              <input type="range" min={6} max={40} value={size} style={{ ['--p' as string]: `${(100 * ((size) - (6))) / Math.max((40) - (6), 1)}%` }} onChange={(e) => regenerate(preset, Number(e.target.value), seed)} />
            </label>
            <div className="presets" role="group" aria-label="Data shape">
              {PRESETS.map((p) => (
                <button key={p.id} className="chip-btn" data-on={preset === p.id} onClick={() => regenerate(p.id, size, p.id === preset ? seed + 1 : seed)}>
                  {p.id === 'random' && <Shuffle size={15} weight="bold" />}
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="race-bar">
          <div className="seg seg-sm" role="radiogroup" aria-label="Draw the arrays as">
            <button role="radio" aria-checked={arrayMode === 'bars'} data-on={arrayMode === 'bars'} onClick={() => setArrayMode('bars')}>
              <ChartBar size={15} weight="bold" aria-hidden="true" /> Bars
            </button>
            <button role="radio" aria-checked={arrayMode === 'cells'} data-on={arrayMode === 'cells'} onClick={() => setArrayMode('cells')}>
              <SquaresFour size={15} weight="bold" aria-hidden="true" /> Array
            </button>
          </div>
        </div>
        <div className="race-grid" data-count={runs.length} style={{ ['--move' as string]: `${Math.round(Math.min(340, Math.max(70, stepDelayMs(player.speed) * 0.85)))}ms` }}>
          {runs.map(({ def, steps, idTrack }) => {
            const i = Math.min(player.index, steps.length - 1);
            const step = steps[i];
            const done = i >= steps.length - 1;
            const place = finishers.indexOf(steps.length) + 1;
            return (
              <section className="racer" key={def.id} data-done={done} aria-label={def.name}>
                <header>
                  <h2>{def.name.replace(' (simplified)', '')}</h2>
                  {done ? <span className="finish">Finished #{place} in {steps.length} steps</span> : <span className="dim">Step {i + 1}</span>}
                </header>
                <BarsView array={step.state.array} marks={step.marks} ids={idTrack[i]} mode={arrayMode} />
                <dl className="racer-stats">
                  {Object.entries(step.stats).map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
                <p className="racer-explain">{step.explain}</p>
              </section>
            );
          })}
        </div>

        <PlayerDock player={player} length={longest} />
      </div>
    </div>
  );
}
