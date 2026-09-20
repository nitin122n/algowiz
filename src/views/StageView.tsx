/** Picks the right renderer for an algorithm's state. */
import type { AlgorithmDef, ArrayState, GraphState, GridState, HanoiState, ListState, SearchState, Step, TableState, TextState, TreeState } from '../core/step';
import { BarsView } from './BarsView';
import { CellsView } from './CellsView';
import { GraphView } from './GraphView';
import { GridView } from './GridView';
import { HanoiView } from './HanoiView';
import { ListView } from './ListView';
import { TextView } from './TextView';
import { TreeView } from './TreeView';
import type { ArrayMode } from '../ui/useArrayMode';

/** Props for {@link StageView}. */
interface StageViewProps {
  def: AlgorithmDef<any, any>;
  step: Step<any>;
  /** Pathfinding boards call this when a cell is clicked. */
  onToggleCell?: (index: number) => void;
  /** Stable element ids for array views, so moved elements slide. */
  ids?: number[];
  /** Bars or boxes for array views. */
  arrayMode?: ArrayMode;
}

/**
 * Renders one step with the view named by `def.view`.
 * @param props - algorithm, step, and optional board editing callback
 */
export function StageView({ def, step, onToggleCell, ids, arrayMode }: StageViewProps) {
  const { state, marks } = step;
  switch (def.view) {
    case 'bars': {
      const s = state as ArrayState | SearchState;
      return <BarsView array={s.array} marks={marks} target={'target' in s ? s.target : undefined} ids={ids} mode={arrayMode} />;
    }
    case 'list':
      return <ListView nodes={(state as ListState).nodes} kind={(state as ListState).kind} marks={marks} />;
    case 'cells':
      return <CellsView state={state as TableState} marks={marks} />;
    case 'grid':
      return <GridView state={state as GridState} marks={marks} onToggle={onToggleCell} />;
    case 'graph':
      return <GraphView state={state as GraphState} marks={marks} />;
    case 'tree':
      return <TreeView state={state as TreeState} marks={marks} />;
    case 'text':
      return <TextView state={state as TextState} marks={marks} />;
    case 'hanoi':
      return <HanoiView state={state as HanoiState} marks={marks} />;
  }
}
