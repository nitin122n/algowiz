import { InputError, str } from '../../core/forms';
import { shape, spread } from '../../core/scale';
import { mulberry32 } from '../../core/random';
import type { Mark, TextState } from '../../core/step';
import { Rec } from '../../core/tracer';
import { defineForm } from '../define';

/** Form shared by the string matchers. */
const FORM = [
  { key: 'text', label: 'Text', type: 'text' as const, default: 'ABABDABACDABABCABAB', maxLength: 28 },
  { key: 'pattern', label: 'Pattern', type: 'text' as const, default: 'ABABCABAB', maxLength: 10 },
];

/** Random text and a pattern taken from it (or altered). */
function randomize(seed: number): Record<string, string> {
  const words = ['ABABDABACDABABCABAB', 'AABAACAADAABAABA', 'GCATCGCAGAGAGTATACAGTACG', 'THISISATESTTEXTTEST', 'ABRACADABRAABRA'];
  const pats = ['ABABCABAB', 'AABA', 'GCAGAGAG', 'TEST', 'ABRA'];
  return { text: words[seed % words.length], pattern: pats[seed % pats.length] };
}

/** Validates the text and pattern. */
function read(input: Record<string, unknown>): { text: string; pattern: string } {
  const text = str(input as never, 'text');
  const pattern = str(input as never, 'pattern');
  if (!pattern) throw new InputError('Enter a pattern to search for.');
  if (pattern.length > text.length) throw new InputError('The pattern is longer than the text, so it cannot match.');
  return { text, pattern };
}

/** Marks a matched window. */
const windowMarks = (start: number, len: number, kind: Mark['kind']): Mark[] => Array.from({ length: len }, (_, k) => ({ kind, index: start + k }));

/** Knuth-Morris-Pratt. */
export const kmp = defineForm({
  id: 'kmp',
  name: 'Knuth-Morris-Pratt (KMP)',
  family: 'strings',
  group: 'String matching',
  summary: 'Precomputes how far the pattern can fall back after a mismatch, so the text pointer never moves backward.',
  complexity: { best: 'O(n + m)', average: 'O(n + m)', worst: 'O(n + m)', space: 'O(m)' },
  pseudocode: ['build fail[]: for each prefix, the length of its longest proper prefix that is also a suffix', 'i = 0 (text), j = 0 (pattern)', 'while i < n', '  if text[i] == pattern[j]: i++, j++', '  if j == m: report a match at i - j; j = fail[j-1]', '  elif mismatch and j > 0: j = fail[j-1]   (do not move i)', '  elif mismatch: i++'],
  form: FORM,
  randomize,
  scale: { sizes: spread(6, 28), unit: 'letters', shapes: [shape('random', 'Random text over A and B', 3), shape('repetitive', 'All A, pattern AAAB')], make: (n, s, seed) => { const r = mulberry32(seed * 7 + n); return s === 'repetitive' ? { text: 'A'.repeat(n), pattern: 'AAAB' } : { text: Array.from({ length: n }, () => (r() < 0.5 ? 'A' : 'B')).join(''), pattern: 'ABAB' }; }, sizeOf: (i) => str(i, 'text').length },
  view: 'text',
  run(input) {
    const { text, pattern } = read(input);
    const m = pattern.length;
    const r = new Rec<TextState>(['comparisons', 'matches']);
    const fail: number[] = Array(m).fill(0);
    r.alloc(m);
    /** Frame builder for both phases. */
    const snap = (shift: number, marks: Mark[], line: number, explain: string, filled: number) =>
      r.snap({ text, pattern, shift, table: fail.map((f, i) => (i < filled ? f : '·')), tableLabel: 'Failure table (fail[j])' }, marks, line, explain);
    snap(0, [], 0, 'First build the failure table for the pattern.', 1);
    for (let i = 1, k = 0; i < m; ) {
      r.count('comparisons');
      if (pattern[i] === pattern[k]) {
        fail[i++] = ++k;
        snap(0, [], 0, `Prefix ${i}: the longest border has length ${k}.`, i);
      } else if (k > 0) {
        k = fail[k - 1];
        snap(0, [], 0, `Mismatch while building: fall back to border length ${k}.`, i);
      } else {
        fail[i++] = 0;
        snap(0, [], 0, `Prefix ${i}: no border, so 0.`, i);
      }
    }
    snap(0, [], 1, `Failure table ready: [${fail.join(', ')}]. Now scan the text.`, m);
    const found: number[] = [];
    for (let i = 0, j = 0; i < text.length; ) {
      r.count('comparisons');
      const shift = i - j;
      if (text[i] === pattern[j]) {
        snap(shift, [...windowMarks(shift, j, 'found'), { kind: 'compare', index: i }], 3, `text[${i}] = "${text[i]}" matches pattern[${j}]: advance both.`, m);
        i++;
        j++;
        if (j === m) {
          found.push(i - j);
          r.count('matches');
          snap(i - j, windowMarks(i - j, m, 'found'), 4, `Match found at position ${i - j}. Fall back using fail[${j - 1}] = ${fail[j - 1]} and keep going.`, m);
          j = fail[j - 1];
        }
      } else if (j > 0) {
        snap(shift, [...windowMarks(shift, j, 'found'), { kind: 'delete', index: i }], 5, `text[${i}] = "${text[i]}" does not match pattern[${j}] = "${pattern[j]}". Slide the pattern using fail[${j - 1}] = ${fail[j - 1]}; the text pointer stays.`, m);
        j = fail[j - 1];
      } else {
        snap(shift, [{ kind: 'delete', index: i }], 6, `text[${i}] = "${text[i]}" does not match the first letter "${pattern[0]}": move on.`, m);
        i++;
      }
    }
    snap(0, found.flatMap((s) => windowMarks(s, m, 'found')), 2, found.length ? `Done: the pattern occurs at position${found.length > 1 ? 's' : ''} ${found.join(', ')}.` : 'Done: the pattern does not occur in the text.', m);
    return r.steps;
  },
});

/** Rabin-Karp rolling hash. */
export const rabinKarp = defineForm({
  id: 'rabin-karp',
  name: 'Rabin-Karp',
  family: 'strings',
  group: 'String matching',
  summary: 'Compares a rolling hash of each text window with the pattern hash, and checks letters only when the hashes agree.',
  complexity: { best: 'O(n + m)', average: 'O(n + m)', worst: 'O(n·m)', space: 'O(1)' },
  pseudocode: ['hash the pattern and the first window of the text', 'for each window position s', '  if hash(window) == hash(pattern): compare the letters to be sure', '  roll: drop the first letter, add the next letter', 'report every confirmed match'],
  form: FORM,
  randomize,
  scale: { sizes: spread(6, 28), unit: 'letters', shapes: [shape('random', 'Random text over A and B', 3), shape('repetitive', 'All A, pattern AAAB')], make: (n, s, seed) => { const r = mulberry32(seed * 7 + n); return s === 'repetitive' ? { text: 'A'.repeat(n), pattern: 'AAAB' } : { text: Array.from({ length: n }, () => (r() < 0.5 ? 'A' : 'B')).join(''), pattern: 'ABAB' }; }, sizeOf: (i) => str(i, 'text').length },
  view: 'text',
  run(input) {
    const { text, pattern } = read(input);
    const m = pattern.length;
    const B = 256;
    const P = 101;
    /** Hash of a string (base 256, modulus 101). */
    const hash = (s: string) => [...s].reduce((h, ch) => (h * B + ch.charCodeAt(0)) % P, 0);
    let high = 1;
    for (let i = 1; i < m; i++) high = (high * B) % P;
    const target = hash(pattern);
    const r = new Rec<TextState>(['windows', 'hash hits', 'matches', 'memory']);
    const hashes: Array<number | string> = Array(text.length - m + 1).fill('·');
    /** Frame builder. */
    const snap = (shift: number, marks: Mark[], line: number, explain: string) => r.snap({ text, pattern, shift, table: [...hashes], tableLabel: `Window hash at each shift (pattern hash = ${target})` }, marks, line, explain);
    snap(0, [], 0, `Pattern "${pattern}" hashes to ${target} (base ${B}, modulus ${P}).`);
    let h = hash(text.slice(0, m));
    const found: number[] = [];
    for (let s = 0; s <= text.length - m; s++) {
      hashes[s] = h;
      r.count('windows');
      const win = windowMarks(s, m, 'range');
      if (h === target) {
        r.count('hash hits');
        const real = text.slice(s, s + m) === pattern;
        if (real) (found.push(s), r.count('matches'));
        snap(s, real ? windowMarks(s, m, 'found') : windowMarks(s, m, 'delete'), 2, real ? `Hash ${h} equals ${target}. Comparing letters confirms a match at ${s}.` : `Hash ${h} equals ${target}, but the letters differ: a spurious hit. Not a match.`);
      } else snap(s, win, 1, `Window "${text.slice(s, s + m)}" hashes to ${h}, not ${target}: skip without comparing letters.`);
      if (s < text.length - m) {
        h = (((h - text.charCodeAt(s) * high) % P + P) * B + text.charCodeAt(s + m)) % P;
        snap(s, win, 3, `Roll the hash: drop "${text[s]}", add "${text[s + m]}".`);
      }
    }
    snap(0, found.flatMap((s) => windowMarks(s, m, 'found')), 4, found.length ? `Done: the pattern occurs at position${found.length > 1 ? 's' : ''} ${found.join(', ')}.` : 'Done: the pattern does not occur in the text.');
    return r.steps;
  },
});

/** Z-algorithm pattern matching. */
export const zAlgorithm = defineForm({
  id: 'z-algorithm',
  name: 'Z-Algorithm',
  family: 'strings',
  group: 'String matching',
  summary: 'Computes, for every position of pattern + "$" + text, how long a prefix match starts there. Positions with the pattern length are matches.',
  complexity: { best: 'O(n + m)', average: 'O(n + m)', worst: 'O(n + m)', space: 'O(n + m)' },
  pseudocode: ['s = pattern + "$" + text', 'keep a window [l, r) where s matches its own prefix', 'for each i', '  if i is inside the window: start from the mirrored value z[i - l]', '  extend the match letter by letter', '  z[i] == pattern length means a match'],
  form: FORM,
  randomize,
  scale: { sizes: spread(6, 28), unit: 'letters', shapes: [shape('random', 'Random text over A and B', 3), shape('repetitive', 'All A, pattern AAAB')], make: (n, s, seed) => { const r = mulberry32(seed * 7 + n); return s === 'repetitive' ? { text: 'A'.repeat(n), pattern: 'AAAB' } : { text: Array.from({ length: n }, () => (r() < 0.5 ? 'A' : 'B')).join(''), pattern: 'ABAB' }; }, sizeOf: (i) => str(i, 'text').length },
  view: 'text',
  run(input) {
    const { text, pattern } = read(input);
    const s = `${pattern}$${text}`;
    const m = pattern.length;
    const z: Array<number | string> = Array(s.length).fill('·');
    const r = new Rec<TextState>(['comparisons', 'matches']);
    r.alloc(2 * s.length);
    /** Frame builder; the whole combined string is drawn as the text. */
    const snap = (marks: Mark[], line: number, explain: string) => r.snap({ text: s, pattern: '', shift: 0, table: [...z], tableLabel: 'Z array (length of the prefix match at each position)' }, marks, line, explain);
    snap([], 0, `Combine into "${s}". The "$" cannot occur in the text, so no match can cross it.`);
    z[0] = s.length;
    let l = 0;
    let rgt = 0;
    const found: number[] = [];
    for (let i = 1; i < s.length; i++) {
      let k = 0;
      if (i < rgt) {
        k = Math.min(rgt - i, z[i - l] as number);
        snap([...windowMarks(l, rgt - l, 'range'), { kind: 'active', index: i }], 3, `Position ${i} is inside the window [${l}, ${rgt}): start from the mirrored value ${k}.`);
      }
      while (i + k < s.length && s[k] === s[i + k]) {
        r.count('comparisons');
        k++;
      }
      z[i] = k;
      if (i + k > rgt) (l = i, (rgt = i + k));
      if (k === m) (found.push(i - m - 1), r.count('matches'));
      snap([{ kind: k === m ? 'found' : 'compare', index: i }, ...windowMarks(i, k, k === m ? 'found' : 'visited')], k === m ? 5 : 4, k === m ? `z[${i}] = ${k} = pattern length: the pattern occurs in the text at position ${i - m - 1}.` : `z[${i}] = ${k}: the prefix matches for ${k} letter${k === 1 ? '' : 's'} starting here.`);
    }
    snap(found.flatMap((p) => windowMarks(p + m + 1, m, 'found')), 5, found.length ? `Done: the pattern occurs at position${found.length > 1 ? 's' : ''} ${found.join(', ')}.` : 'Done: the pattern does not occur in the text.');
    return r.steps;
  },
});
