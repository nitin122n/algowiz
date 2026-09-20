/** Human labels and helpers for step marks, shared by every view and the legend. */
import type { Mark, MarkKind } from '../core/step';

/** Legend text for each mark kind. */
export const MARK_META: Record<MarkKind, { label: string; hint: string }> = {
  compare: { label: 'Comparing', hint: 'Values being compared right now' },
  swap: { label: 'Moving', hint: 'Values being swapped or written' },
  active: { label: 'Active', hint: 'The element being worked on' },
  found: { label: 'Found', hint: 'The search target' },
  sorted: { label: 'Sorted', hint: 'Already in its final position' },
  pivot: { label: 'Pivot', hint: 'The pivot for this partition' },
  range: { label: 'In range', hint: 'Still a candidate' },
  insert: { label: 'New', hint: 'Just inserted or reversed' },
  delete: { label: 'Removing', hint: 'About to be removed' },
  notfound: { label: 'Ruled out', hint: 'Cannot be the target' },
  pointer: { label: 'Pointer', hint: 'A named pointer or boundary' },
  frontier: { label: 'Frontier', hint: 'Discovered, waiting to be processed' },
  visited: { label: 'Visited', hint: 'Already processed' },
  path: { label: 'Path', hint: 'Part of the answer' },
};

/** When several marks land on one index, the earliest kind in this list decides the color. */
const PRIORITY: MarkKind[] = ['found', 'path', 'swap', 'delete', 'pivot', 'compare', 'insert', 'active', 'pointer', 'frontier', 'sorted', 'visited', 'range', 'notfound'];

/** What a view needs to draw one index. */
export interface IndexMark {
  /** Winning kind, or null when unmarked. */
  top: MarkKind | null;
  /** Labels to print above the element (lo, hi, mid, curr ...). */
  labels: string[];
}

/**
 * Collapses a step's marks into one entry per index.
 * @param marks - the step's marks
 * @returns a map from index to its winning kind and labels
 */
export function marksByIndex(marks: Mark[]): Map<number, IndexMark> {
  const map = new Map<number, IndexMark>();
  for (const m of marks) {
    const cur = map.get(m.index) ?? { top: null, labels: [] };
    if (cur.top === null || PRIORITY.indexOf(m.kind) < PRIORITY.indexOf(cur.top)) cur.top = m.kind;
    if (m.label && !cur.labels.includes(m.label)) cur.labels.push(m.label);
    map.set(m.index, cur);
  }
  return map;
}
