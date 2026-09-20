/** Shared building blocks for sorting algorithms. */
import type { Mark } from '../../core/step';
import type { Tracer } from '../../core/tracer';

/**
 * Builds `sorted` marks for a range of indices.
 * @param lo - first index (inclusive)
 * @param hi - last index (inclusive)
 * @returns one `sorted` mark per index; empty when hi < lo
 */
export function sortedMarks(lo: number, hi: number): Mark[] {
  const marks: Mark[] = [];
  for (let i = lo; i <= hi; i++) marks.push({ kind: 'sorted', index: i });
  return marks;
}

/**
 * Builds `range` marks for the window being worked on.
 * @param lo - first index (inclusive)
 * @param hi - last index (inclusive)
 * @returns one `range` mark per index
 */
export function windowMarks(lo: number, hi: number): Mark[] {
  const marks: Mark[] = [];
  for (let i = lo; i <= hi; i++) marks.push({ kind: 'range', index: i });
  return marks;
}

/**
 * Merges the sorted runs a[lo..mid] and a[mid+1..hi] in place, recording every comparison and write.
 * Stable: on ties the left element is taken first.
 * @param t - active tracer holding the array
 * @param lo - start of the left run
 * @param mid - end of the left run
 * @param hi - end of the right run
 * @param cmpLine - pseudocode line for comparisons
 * @param writeLine - pseudocode line for writes
 */
export function mergeRange(t: Tracer, lo: number, mid: number, hi: number, cmpLine: number, writeLine: number): void {
  const left = t.a.slice(lo, mid + 1);
  const right = t.a.slice(mid + 1, hi + 1);
  t.alloc(hi - lo + 1);
  let i = 0;
  let j = 0;
  let k = lo;
  const win = windowMarks(lo, hi);
  while (i < left.length && j < right.length) {
    if (t.compareVals(lo + i, mid + 1 + j, left[i], right[j], cmpLine, win)) {
      t.write(k++, right[j++], writeLine, undefined, win);
    } else {
      t.write(k++, left[i++], writeLine, undefined, win);
    }
  }
  while (i < left.length) t.write(k++, left[i++], writeLine, undefined, win);
  while (j < right.length) t.write(k++, right[j++], writeLine, undefined, win);
  t.free(hi - lo + 1);
}
