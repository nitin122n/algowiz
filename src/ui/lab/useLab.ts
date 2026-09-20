/** Runs the Complexity Lab measurements in small time slices, so charts fill in live without freezing the page. */
import { useEffect, useReducer } from 'react';
import { aggregate, labTasks, runTask, type LabPoint, type LabRun, type LabTask } from '../../core/lab';
import { scaleFor } from '../../core/scale';
import type { AlgorithmDef } from '../../core/step';

/** What a chart needs while measuring and after. */
export interface LabData {
  /** Averaged points per shape id. */
  points: Record<string, LabPoint[]>;
  /** Runs finished so far. */
  done: number;
  /** Runs in total. */
  total: number;
}

/** Measurement progress for one algorithm; shared by every chart that shows it. */
interface Entry {
  tasks: LabTask[];
  next: number;
  runs: LabRun[];
  data: LabData;
  listeners: Set<() => void>;
  timer: number | null;
}

/** Module-level cache: results survive tab switches and are reused by the compare overlay. */
const cache = new Map<string, Entry>();

/** Longest a single slice may run before yielding to the browser, in milliseconds. */
const SLICE_MS = 12;

/**
 * Continues measuring an entry, one time slice at a time, notifying charts after each slice.
 * @param def - the algorithm
 * @param e - its cache entry
 */
function pump(def: AlgorithmDef<any, any>, e: Entry): void {
  const spec = scaleFor(def);
  if (!spec || e.timer !== null || e.next >= e.tasks.length) return;
  e.timer = window.setTimeout(() => {
    e.timer = null;
    const t0 = performance.now();
    while (e.next < e.tasks.length && performance.now() - t0 < SLICE_MS) {
      const run = runTask(def, spec, e.tasks[e.next++]);
      if (run) e.runs.push(run);
    }
    e.data = { points: aggregate(e.runs), done: e.next, total: e.tasks.length };
    e.listeners.forEach((l) => l());
    // Keep going only while someone is watching; a later chart resumes where this stopped.
    if (e.listeners.size) pump(def, e);
  }, 0);
}

/**
 * Measures an algorithm across input sizes and returns the results so far.
 * @param def - the algorithm, or null for nothing
 * @returns live results, or null when the algorithm has no scaling recipe
 */
export function useLab(def: AlgorithmDef<any, any> | null | undefined): LabData | null {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const spec = def ? scaleFor(def) : null;
  useEffect(() => {
    if (!def || !spec) return;
    let e = cache.get(def.id);
    if (!e) {
      const tasks = labTasks(spec);
      e = { tasks, next: 0, runs: [], data: { points: {}, done: 0, total: tasks.length }, listeners: new Set(), timer: null };
      cache.set(def.id, e);
    }
    const entry = e;
    entry.listeners.add(rerender);
    pump(def, entry);
    return () => {
      entry.listeners.delete(rerender);
    };
  }, [def, spec]);
  if (!def || !spec) return null;
  return cache.get(def.id)?.data ?? { points: {}, done: 0, total: labTasks(spec).length };
}
