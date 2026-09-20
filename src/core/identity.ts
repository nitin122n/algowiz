/**
 * Gives each array element a stable identity across steps, so renderers can slide elements to their
 * new positions (a swap animates as two bars trading places) instead of redrawing them in place.
 */

/**
 * Tracks element identities through a run.
 * Values that stay put keep their id. A value that moved is matched to the nearest unclaimed spot that
 * held the same value in the previous step. A value that appeared from nowhere (a copy written by merge
 * sort) gets a fresh id, so it pops in rather than sliding.
 * @param arrays - the array of every step, in order
 * @returns one id list per step, aligned with the array positions
 */
export function trackIds(arrays: number[][]): number[][] {
  if (!arrays.length) return [];
  let next = arrays[0].length;
  const out: number[][] = [arrays[0].map((_, i) => i)];
  for (let s = 1; s < arrays.length; s++) {
    const a = arrays[s - 1];
    const b = arrays[s];
    const prev = out[s - 1];
    if (a === b || (a.length === b.length && a.every((v, i) => v === b[i]))) {
      out.push(prev);
      continue;
    }
    const ids = new Array<number>(b.length);
    const claimed = new Uint8Array(a.length);
    const pending: number[] = [];
    for (let k = 0; k < b.length; k++) {
      if (k < a.length && a[k] === b[k]) {
        ids[k] = prev[k];
        claimed[k] = 1;
      } else pending.push(k);
    }
    for (const k of pending) {
      let best = -1;
      for (let m = 0; m < a.length; m++) if (!claimed[m] && a[m] === b[k] && (best < 0 || Math.abs(m - k) < Math.abs(best - k))) best = m;
      if (best >= 0) {
        ids[k] = prev[best];
        claimed[best] = 1;
      } else ids[k] = next++;
    }
    out.push(ids);
  }
  return out;
}
