/** Right-hand tabbed panels: Explain, Code, Theory, Stats, History. */
import { memo, useEffect, useRef, useState } from 'react';
import { CaretRight } from '@phosphor-icons/react';
import type { AlgorithmDef, Step } from '../core/step';
import { ComplexityLab } from './lab/ComplexityLab';
import { CounterTimeline } from './lab/CounterTimeline';

/** Tab ids. */
type Tab = 'explain' | 'code' | 'theory' | 'stats' | 'history';

/** Tabs in display order. */
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'explain', label: 'Explain' },
  { id: 'code', label: 'Code' },
  { id: 'theory', label: 'Theory' },
  { id: 'stats', label: 'Stats' },
  { id: 'history', label: 'History' },
];

/** Props for {@link Panels}. */
interface PanelsProps {
  def: AlgorithmDef<any, any>;
  steps: Step<any>[];
  index: number;
  onSeek: (i: number) => void;
  /** Input of the current run (null while the form is invalid); places the run on the lab chart. */
  input: unknown;
}

/**
 * Tabbed side panel. Only the active tab renders, so long histories cost nothing when hidden.
 * @param props - algorithm, run, current index, and seek callback
 */
export function Panels({ def, steps, index, onSeek, input }: PanelsProps) {
  const [tab, setTab] = useState<Tab>('explain');
  const step = steps[index];
  return (
    <aside className="panels" aria-label="Details">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls="panel-body" onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="panel-body" id="panel-body" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'explain' && <ExplainTab def={def} steps={steps} index={index} />}
        {tab === 'code' && <CodeTab def={def} line={step?.line ?? null} />}
        {tab === 'theory' && <TheoryTab def={def} steps={steps} index={index} input={input} />}
        {tab === 'stats' && <StatsTab steps={steps} index={index} onSeek={onSeek} />}
        {tab === 'history' && <HistoryTab steps={steps} index={index} onSeek={onSeek} />}
      </div>
    </aside>
  );
}

/** Explain tab: what the algorithm does, the current sentence, and the last few sentences. */
function ExplainTab({ def, steps, index }: { def: AlgorithmDef<any, any>; steps: Step<any>[]; index: number }) {
  const recent = steps.slice(Math.max(0, index - 4), index).reverse();
  return (
    <div className="stack">
      <p className="lead">{def.summary}</p>
      <div className="now">
        <span className="now-label">Now</span>
        <p>{steps[index]?.explain}</p>
      </div>
      {recent.length > 0 && (
        <div>
          <h3>Just before</h3>
          <ol className="recent">
            {recent.map((s, k) => (
              <li key={k} style={{ opacity: 1 - k * 0.2 }}>{s.explain}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** Code tab: pseudocode with the active line highlighted. */
function CodeTab({ def, line }: { def: AlgorithmDef<any, any>; line: number | null }) {
  return (
    <ol className="code" aria-label="Pseudocode">
      {def.pseudocode.map((text, i) => (
        <li key={i} data-active={line === i} aria-current={line === i ? 'step' : undefined}>
          <span className="ln">{line === i ? <CaretRight size={12} weight="bold" aria-hidden="true" /> : i + 1}</span>
          <code>{text}</code>
        </li>
      ))}
    </ol>
  );
}

/** Theory tab: complexity table, invariant, proof, and notes. */
function TheoryTab({ def, steps, index, input }: { def: AlgorithmDef<any, any>; steps: Step<any>[]; index: number; input: unknown }) {
  const c = def.complexity;
  const { invariant, proof, notes } = def.theory;
  return (
    <div className="stack">
      <ComplexityLab def={def} steps={steps} index={index} input={input} />
      <table className="complexity">
        <caption className="sr-only">Complexity</caption>
        <tbody>
          <tr><th scope="row">Best</th><td>{c.best}</td></tr>
          <tr><th scope="row">Average</th><td>{c.average}</td></tr>
          <tr><th scope="row">Worst</th><td>{c.worst}</td></tr>
          <tr><th scope="row">Space</th><td>{c.space}</td></tr>
        </tbody>
      </table>
      {invariant && (
        <div>
          <h3>Invariant</h3>
          <p>{invariant}</p>
        </div>
      )}
      {proof && proof.length > 0 && (
        <div>
          <h3>Why it works</h3>
          <ol className="proof">{proof.map((p, i) => <li key={i}>{p}</li>)}</ol>
        </div>
      )}
      {notes && notes.length > 0 && (
        <div>
          <h3>Notes</h3>
          <ul className="notes">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </div>
      )}
      {!invariant && !proof && !notes && <p className="dim">No theory notes for this algorithm yet.</p>}
    </div>
  );
}

/** Stats tab: current counters plus a timeline of every counter over the run. */
function StatsTab({ steps, index, onSeek }: { steps: Step<any>[]; index: number; onSeek: (i: number) => void }) {
  const step = steps[index];
  const entries = Object.entries(step?.stats ?? {});
  return (
    <div className="stack">
      <dl className="stats">
        <div><dt>Step</dt><dd>{index + 1}<span className="dim"> / {steps.length}</span></dd></div>
        {entries.map(([k, v]) => (
          <div key={k}><dt>{k === 'memory' ? 'peak memory' : k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      <div>
        <h3>Counters over time</h3>
        <CounterTimeline steps={steps} index={index} onSeek={onSeek} />
      </div>
    </div>
  );
}

/** One clickable row in the history list. */
const HistoryRow = memo(function HistoryRow({ i, text, active, onSeek }: { i: number; text: string; active: boolean; onSeek: (i: number) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  return (
    <li>
      <button ref={ref} data-active={active} onClick={() => onSeek(i)}>
        <span className="ln">{i + 1}</span>
        {text}
      </button>
    </li>
  );
});

/** History tab: a window of steps around the current one; click a row to jump there. */
function HistoryTab({ steps, index, onSeek }: { steps: Step<any>[]; index: number; onSeek: (i: number) => void }) {
  const from = Math.max(0, index - 30);
  const to = Math.min(steps.length, index + 120);
  return (
    <ol className="history" aria-label="Step history">
      {from > 0 && <li className="dim more">{from} earlier steps</li>}
      {steps.slice(from, to).map((s, k) => (
        <HistoryRow key={from + k} i={from + k} text={s.explain} active={from + k === index} onSeek={onSeek} />
      ))}
      {to < steps.length && <li className="dim more">{steps.length - to} later steps</li>}
    </ol>
  );
}
