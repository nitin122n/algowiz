/** Shared building blocks for search algorithms. */
import type { Mark } from '../../core/step';
import { rangeMarks, type SearchTracer } from '../../core/tracer';

/**
 * Builds `notfound` ("ruled out") marks for indices lo..hi.
 * @param lo - first index (inclusive)
 * @param hi - last index (inclusive)
 * @returns one mark per index; empty when hi < lo
 */
export function ruledOut(lo: number, hi: number): Mark[] {
  const marks: Mark[] = [];
  for (let i = Math.max(lo, 0); i <= hi; i++) marks.push({ kind: 'notfound', index: i });
  return marks;
}

/**
 * Runs binary search on a[lo..hi], recording every probe.
 * @param t - tracer for the run
 * @param a - sorted array
 * @param lo - first index of the window
 * @param hi - last index of the window
 * @param probeLine - pseudocode line for the probe
 * @param moveLine - pseudocode line where the window shrinks
 * @returns the index of a match, or -1
 */
export function binaryWindow(t: SearchTracer, a: number[], lo: number, hi: number, probeLine: number, moveLine: number): number {
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const marks: Mark[] = [
      ...ruledOut(0, lo - 1),
      ...ruledOut(hi + 1, a.length - 1),
      ...rangeMarks(lo, hi),
      { kind: 'pointer', index: lo, label: 'lo' },
      { kind: 'pointer', index: hi, label: 'hi' },
    ];
    const c = t.probe(mid, probeLine, marks, 'mid');
    if (c === 0) return mid;
    if (c < 0) {
      t.snap([...marks, { kind: 'compare', index: mid }], moveLine, `${a[mid]} is too small, so discard indices ${lo}..${mid} and search the right half.`);
      lo = mid + 1;
    } else {
      t.snap([...marks, { kind: 'compare', index: mid }], moveLine, `${a[mid]} is too big, so discard indices ${mid}..${hi} and search the left half.`);
      hi = mid - 1;
    }
  }
  return -1;
}
