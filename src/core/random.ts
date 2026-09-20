/** Seeded randomness and input generators, so runs are reproducible and shareable by URL. */

/**
 * Creates a deterministic pseudo-random generator (mulberry32).
 * @param seed - integer seed
 * @returns a function returning floats in [0, 1)
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Preset input shapes offered by the input panel. */
export type InputPreset = 'random' | 'sorted' | 'reversed' | 'nearly' | 'unique';

/**
 * Generates an array for a preset shape.
 * @param preset - shape of the data
 * @param n - number of elements
 * @param seed - seed for reproducibility
 * @param max - largest value produced (values are 1..max)
 * @returns the generated array
 */
export function makeArray(preset: InputPreset, n: number, seed: number, max = 99): number[] {
  const rnd = mulberry32(seed);
  /** Draws one value in 1..max. */
  const rand = () => 1 + Math.floor(rnd() * max);
  const base = Array.from({ length: n }, rand);
  switch (preset) {
    case 'sorted':
      return base.sort((a, b) => a - b);
    case 'reversed':
      return base.sort((a, b) => b - a);
    case 'nearly': {
      const a = base.sort((x, y) => x - y);
      // Swap a few random pairs so the array is almost, not fully, sorted.
      for (let k = 0; k < Math.max(1, Math.floor(n / 8)); k++) {
        const i = Math.floor(rnd() * n);
        const j = Math.floor(rnd() * n);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    case 'unique': {
      // Few unique values: draw from a small pool so many duplicates appear.
      const pool = [1, 2, 3, 4].map((k) => k * Math.floor(max / 4));
      return base.map(() => pool[Math.floor(rnd() * pool.length)]);
    }
    default:
      return base;
  }
}

/**
 * Parses free text such as "5, 3, 8" or "[5 3 8]" into integers.
 * @param text - user input
 * @returns the numbers, or an error message describing the first problem
 */
export function parseNumbers(text: string): { ok: true; values: number[] } | { ok: false; error: string } {
  const cleaned = text.replace(/[[\]]/g, ' ').trim();
  if (cleaned === '') return { ok: false, error: 'Enter at least one number.' };
  const parts = cleaned.split(/[\s,;]+/).filter(Boolean);
  const values: number[] = [];
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v)) return { ok: false, error: `"${p}" is not a whole number.` };
    values.push(v);
  }
  return { ok: true, values };
}
