/** Turns complexity strings such as "O(n log n)" into functions the growth chart can draw. */

/** A growth curve: operations as a function of input size. */
export type Growth = (n: number) => number;

/** A recognized growth class. */
export interface GrowthClass {
  /** Short name for accessible descriptions. */
  name: string;
  fn: Growth;
  /** How costly the class is, 0 (cheap) to 3 (explosive); drives the pill tint. */
  cost: 0 | 1 | 2 | 3;
}

/**
 * Recognizes the growth class of a complexity string.
 * Variables other than n (V, E, m, W ...) are all treated as "the size of the input", which is enough to
 * compare shapes on one chart.
 * @param s - text like "O(n²)" or "O(V + E)"
 * @returns the class, or null for things like "unbounded" that cannot be drawn
 */
export function growthOf(s: string): GrowthClass | null {
  const t = s.toLowerCase();
  if (t.includes('unbounded')) return null;
  if (/[2-9]ⁿ|\^/.test(t)) return { name: 'exponential', fn: (n) => 2 ** n, cost: 3 };
  if (t.includes('!')) return { name: 'factorial', fn: (n) => [...Array(Math.min(n, 12))].reduce((f, _, i) => f * (i + 1), 1), cost: 3 };
  if (/[nv]³/.test(t)) return { name: 'cubic', fn: (n) => n ** 3, cost: 3 };
  if (/log\s*log/.test(t)) return { name: 'log log n', fn: (n) => Math.log2(Math.max(2, Math.log2(n + 2))), cost: 0 };
  if (/[a-z]\s*log/.test(t)) return { name: 'n log n', fn: (n) => n * Math.log2(n + 1), cost: 1 };
  if (/[nve]²/.test(t) || /[a-z]·[a-z]/.test(t)) {
    // d·(n + b) style formulas are linear in the input size.
    if (/·\(/.test(t)) return { name: 'linear', fn: (n) => n, cost: 1 };
    return { name: 'quadratic', fn: (n) => n * n, cost: 2 };
  }
  if (t.includes('log')) return { name: 'logarithmic', fn: (n) => Math.log2(n + 1), cost: 0 };
  if (t.includes('√')) return { name: 'square root', fn: (n) => Math.sqrt(n), cost: 0 };
  if (/o\(1\)|α/.test(t)) return { name: 'constant', fn: () => 1, cost: 0 };
  return { name: 'linear', fn: (n) => n, cost: 1 };
}
