/** Pure playback helpers used by the `usePlayer` hook; kept separate so they are trivially testable. */

/**
 * Clamps a step index into the valid range for a run of `len` steps.
 * @param i - requested index
 * @param len - number of steps
 * @returns an index in [0, len - 1], or 0 when the run is empty
 */
export function clampIndex(i: number, len: number): number {
  if (len <= 0) return 0;
  return Math.min(Math.max(Math.trunc(i), 0), len - 1);
}

/**
 * Converts the speed multiplier into a delay between auto-played steps.
 * @param speed - multiplier, 0.25 (slow) to 8 (fast)
 * @returns delay in milliseconds
 */
export function stepDelayMs(speed: number): number {
  const s = Math.min(Math.max(speed, 0.25), 8);
  return Math.round(800 / s);
}
