/** Tower of Hanoi renderer: three pegs with stacked disks. */
import type { HanoiState, Mark } from '../core/step';

/** Props for {@link HanoiView}. */
interface HanoiViewProps {
  state: HanoiState;
  marks: Mark[];
}

/**
 * Draws pegs A, B, and C. Disk width grows with its size; the disk that just moved (mark index = disk size) is lifted.
 * @param props - peg contents and marks
 */
export function HanoiView({ state, marks }: HanoiViewProps) {
  const moved = new Set(marks.map((m) => m.index));
  return (
    <div className="hanoi-view" role="img" aria-label={`Pegs: ${state.pegs.map((p, i) => `${'ABC'[i]} holds ${p.join(', ') || 'nothing'}`).join('; ')}`}>
      {state.pegs.map((disks, p) => (
        <div className="peg" key={p}>
          <div className="peg-stack">
            <span className="peg-pole" />
            {disks.map((d) => (
              <span
                key={d}
                className="disk"
                data-moved={moved.has(d)}
                style={{ width: `${28 + (d / state.n) * 66}%`, ['--dh' as string]: (d / state.n) * 300 }}
              >
                {d}
              </span>
            ))}
          </div>
          <span className="peg-name">{'ABC'[p]}</span>
        </div>
      ))}
    </div>
  );
}
