/** The Complexity Lab engine: runs an algorithm over growing inputs and summarizes the counters. */
import type { AlgorithmDef, ScaleSpec, Step } from './step';

/** One run to perform. */
export interface LabTask {
  shape: string;
  n: number;
  seed: number;
}

/** Final counters of one run, placed at the input size it had. */
export interface LabRun {
  shape: string;
  x: number;
  stats: Record<string, number>;
  steps: number;
}

/** Averaged measurement for one shape at one size. */
export interface LabPoint {
  x: number;
  stats: Record<string, number>;
  steps: number;
}

/** Pseudo-counter meaning "number of recorded steps". Every algorithm has it. */
export const STEPS = 'steps';

/**
 * Lists every run needed, size by size, so curves fill in from left to right while measuring.
 * @param spec - the scaling recipe
 */
export function labTasks(spec: ScaleSpec<unknown>): LabTask[] {
  const tasks: LabTask[] = [];
  for (const n of spec.sizes) for (const s of spec.shapes) for (let seed = 1; seed <= s.seeds; seed++) tasks.push({ shape: s.id, n, seed });
  return tasks;
}

/**
 * Performs one run. Inputs the algorithm rejects are skipped (returns null) rather than failing the lab.
 * @param def - the algorithm
 * @param spec - its scaling recipe
 * @param task - which input to build
 */
export function runTask(def: AlgorithmDef<any, any>, spec: ScaleSpec<any>, task: LabTask): LabRun | null {
  try {
    const input = spec.make(task.n, task.shape, task.seed);
    const steps: Step<unknown>[] = def.run(input);
    const last = steps[steps.length - 1];
    return { shape: task.shape, x: spec.sizeOf(input), stats: { ...last.stats }, steps: steps.length };
  } catch {
    return null;
  }
}

/**
 * Averages runs that share a shape and size.
 * @param runs - finished runs
 * @returns points per shape, sorted by size
 */
export function aggregate(runs: LabRun[]): Record<string, LabPoint[]> {
  const groups = new Map<string, LabRun[]>();
  for (const r of runs) {
    const key = `${r.shape}|${r.x}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const out: Record<string, LabPoint[]> = {};
  for (const list of groups.values()) {
    const keys = new Set(list.flatMap((r) => Object.keys(r.stats)));
    const stats: Record<string, number> = {};
    for (const k of keys) stats[k] = list.reduce((s, r) => s + (r.stats[k] ?? 0), 0) / list.length;
    (out[list[0].shape] ??= []).push({ x: list[0].x, stats, steps: list.reduce((s, r) => s + r.steps, 0) / list.length });
  }
  for (const pts of Object.values(out)) pts.sort((a, b) => a.x - b.x);
  return out;
}

/**
 * Reads one metric from a point or a step.
 * @param p - measured point, or a step plus its 1-based position
 * @param metric - counter name, or {@link STEPS}
 */
export function metricOf(p: { stats: Record<string, number>; steps: number }, metric: string): number {
  return metric === STEPS ? p.steps : p.stats[metric] ?? 0;
}

/** Counters that describe work done, in order of preference for the default time metric. */
const WORK_PREFERENCE = ['comparisons', 'cells explored', 'edges checked', 'relaxations', 'checks', 'cells filled', 'calls', 'letters checked', 'nodes touched', 'moves', 'placements', 'tries', 'finds', 'visited', 'windows', 'divisions', 'multiplications', 'operations'];

/**
 * Picks the counter the lab shows first for time.
 * @param keys - counters the algorithm reports
 */
export function defaultTimeMetric(keys: string[]): string {
  return WORK_PREFERENCE.find((k) => keys.includes(k)) ?? STEPS;
}

/**
 * Human label for a metric.
 * @param metric - counter name
 */
export function metricLabel(metric: string): string {
  if (metric === STEPS) return 'recorded steps';
  if (metric === 'memory') return 'peak extra memory (cells)';
  return metric.replace(/([A-Z])/g, ' $1').toLowerCase();
}
