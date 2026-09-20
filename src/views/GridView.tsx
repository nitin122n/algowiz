/** Grid renderer: pathfinding boards, mazes, Sudoku, and N-Queens. */
import { Crown, Flag, Target } from '@phosphor-icons/react';
import type { GridState, Mark } from '../core/step';
import { marksByIndex } from './markMeta';

/** Props for {@link GridView}. */
interface GridViewProps {
  state: GridState;
  marks: Mark[];
  /** When set, clicking a cell calls this (used to draw walls on pathfinding boards). */
  onToggle?: (index: number) => void;
}

/**
 * Draws square cells. Walls are dark, mud is hatched, start and goal carry icons, and text cells (digits, queens)
 * are centered. When `state.block` is set, thicker lines separate blocks (Sudoku).
 * @param props - grid state, marks, and optional click handler
 */
export function GridView({ state, marks, onToggle }: GridViewProps) {
  const byIndex = marksByIndex(marks);
  const { rows, cols, walls, cost, start, goal, text, fixed, block } = state;
  const maze = rows > 12 && cols > 12 && !text && start === undefined;
  return (
    <div className="grid-view" data-editable={!!onToggle}>
      <div
        className="grid-board"
        data-maze={maze}
        role="grid"
        aria-label={onToggle ? 'Board. Click a cell to toggle a wall.' : 'Board'}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, ['--cols' as string]: cols, ['--rows' as string]: rows }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const m = byIndex.get(i);
          const r = Math.floor(i / cols);
          const c = i % cols;
          const edge = block && ((c + 1) % block === 0 && c < cols - 1 ? 'r' : '') + ((r + 1) % block === 0 && r < rows - 1 ? 'b' : '');
          return (
            <div
              key={i}
              role="gridcell"
              className="gcell"
              data-mark={m?.top ?? 'none'}
              data-wall={walls[i]}
              data-mud={!!cost && cost[i] > 1}
              data-fixed={fixed?.[i]}
              data-edge={edge || undefined}
              data-clickable={!!onToggle && i !== start && i !== goal}
              onClick={onToggle && i !== start && i !== goal ? () => onToggle(i) : undefined}
              title={cost && cost[i] > 1 ? `Cell ${i} (mud, cost ${cost[i]})` : `Cell ${i}`}
            >
              {i === start && <Flag size="70%" weight="fill" aria-label="Start" />}
              {i === goal && <Target size="70%" weight="bold" aria-label="Goal" />}
              {text?.[i] === 'Q' && <Crown size="72%" weight="fill" aria-label="Queen" />}
              {text?.[i] && text[i] !== 'Q' ? text[i] : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
