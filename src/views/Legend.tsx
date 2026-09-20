/** Color legend listing only the mark kinds that occur in the current run. */
import type { MarkKind } from '../core/step';
import { MARK_META } from './markMeta';

/** Props for {@link Legend}. */
interface LegendProps {
  /** Mark kinds used anywhere in the run. */
  kinds: MarkKind[];
}

/**
 * Renders swatches with labels so color is never the only signal.
 * @param props - the kinds to show
 */
export function Legend({ kinds }: LegendProps) {
  return (
    <ul className="legend" aria-label="Legend">
      {kinds.map((k) => (
        <li key={k} title={MARK_META[k].hint}>
          <span className="swatch" data-mark={k} aria-hidden="true" />
          {MARK_META[k].label}
        </li>
      ))}
    </ul>
  );
}
