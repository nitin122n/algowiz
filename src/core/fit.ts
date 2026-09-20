/** Fits measured (size, cost) points to the common growth classes. */

/** A growth class that measurements can be compared with. */
export interface FitClass {
  /** Label in Big-O style, without the O(). */
  label: string;
  fn: (n: number) => number;
}

/** Candidate classes, cheapest first. Ties go to the cheaper class. */
export const FIT_CLASSES: FitClass[] = [
  { label: '1', fn: () => 1 },
  { label: 'log n', fn: (n) => Math.log2(n + 1) },
  { label: '√n', fn: (n) => Math.sqrt(n) },
  { label: 'n', fn: (n) => n },
  { label: 'n log n', fn: (n) => n * Math.log2(n + 1) },
  { label: 'n²', fn: (n) => n * n },
  { label: 'n³', fn: (n) => n ** 3 },
  { label: '2ⁿ', fn: (n) => 2 ** n },
];

/** Result of a fit. */
export interface Fit {
  cls: FitClass;
  /** Scale factor: the fitted curve is c * cls.fn(n). */
  c: number;
  /** Relative root-mean-square error; smaller is better. */
  error: number;
}

/**
 * Least-squares fit of y = c * f(x) for one class.
 * @param pts - measured points
 * @param cls - class to fit
 */
export function fitOne(pts: Array<{ x: number; y: number }>, cls: FitClass): Fit {
  let num = 0;
  let den = 0;
  for (const p of pts) {
    const g = cls.fn(p.x);
    num += p.y * g;
    den += g * g;
  }
  const c = den ? num / den : 0;
  const scale = Math.max(...pts.map((p) => p.y), 1);
  const err = Math.sqrt(pts.reduce((s, p) => s + ((p.y - c * cls.fn(p.x)) / scale) ** 2, 0) / Math.max(pts.length, 1));
  return { cls, c, error: err };
}

/**
 * Picks the class whose shape best matches the points.
 * All-zero data counts as constant. A class must beat the cheaper one by a margin to win, so noise
 * does not promote n to n log n.
 * @param pts - measured points, at least two sizes
 * @returns the best fit, or null when there are too few points
 */
export function bestFit(pts: Array<{ x: number; y: number }>): Fit | null {
  if (pts.length < 2) return null;
  if (pts.every((p) => p.y === pts[0].y)) return { cls: FIT_CLASSES[0], c: pts[0].y, error: 0 };
  let best: Fit | null = null;
  for (const cls of FIT_CLASSES) {
    const f = fitOne(pts, cls);
    if (!best || f.error < best.error * 0.85) best = f;
  }
  return best;
}
