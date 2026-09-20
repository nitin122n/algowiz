import { InputError, int, nums, str } from '../../core/forms';
import { shape, spread } from '../../core/scale';
import type { GridState, HanoiState, Mark } from '../../core/step';
import { Rec } from '../../core/tracer';
import { Table, cellMark } from '../../core/table';
import { defineForm } from '../define';

/** Hard cap on recorded steps for search-heavy puzzles; the run ends with a clear message when reached. */
const STEP_CAP = 4000;

/** N-Queens. */
export const nQueens = defineForm({
  id: 'n-queens',
  name: 'N-Queens',
  family: 'classics',
  group: 'Backtracking',
  summary: 'Places one queen per row, trying columns left to right, and backs up whenever no column is safe.',
  complexity: { best: 'O(n!)', average: 'O(n!)', worst: 'O(n!)', space: 'O(n)' },
  pseudocode: ['place(row): if row == n: solved', '  for each column c in this row', '    if no queen above attacks (row, c)', '      put a queen there; place(row + 1)', '      if that failed: remove the queen (backtrack)', '  return false'],
  form: [{ key: 'n', label: 'Board size', type: 'int', default: 6, min: 4, max: 8 }],
  randomize: (seed) => ({ n: String(4 + (seed % 5)) }),
  scale: { sizes: [4, 5, 6, 7, 8], unit: 'board size', shapes: [shape('board', 'n x n board')], make: (n) => ({ n }), sizeOf: (i) => int(i, 'n') },
  view: 'grid',
  run(input) {
    const n = int(input, 'n');
    const r = new Rec<GridState>(['placements', 'backtracks']);
    const col: number[] = [];
    r.alloc(n);
    let steps = 0;
    /** Draws the board with queens and optional marks. */
    const snap = (marks: Mark[], line: number, explain: string) => {
      steps++;
      const text = Array(n * n).fill('');
      col.forEach((c, row) => (text[row * n + c] = 'Q'));
      r.snap({ rows: n, cols: n, walls: Array(n * n).fill(false), text }, marks, line, explain);
    };
    /** True when a queen at (row, c) would be attacked by an earlier row. */
    const attacked = (row: number, c: number) => col.some((cc, rr) => cc === c || Math.abs(cc - c) === row - rr);
    snap([], 0, `Place ${n} queens so none attack each other.`);
    /** Tries to fill rows from `row` downward. */
    const place = (row: number): boolean => {
      if (row === n) return true;
      r.enter();
      const ok = placeBody(row);
      r.leave();
      return ok;
    };
    /** Tries every column of one row. */
    const placeBody = (row: number): boolean => {
      for (let c = 0; c < n; c++) {
        if (steps > STEP_CAP) return false;
        if (attacked(row, c)) {
          snap([{ kind: 'delete', index: row * n + c }], 2, `Row ${row + 1}, column ${c + 1}: attacked by an earlier queen.`);
          continue;
        }
        col.push(c);
        r.count('placements');
        snap([{ kind: 'found', index: row * n + c }], 3, `Row ${row + 1}, column ${c + 1} is safe: place a queen.`);
        if (place(row + 1)) return true;
        col.pop();
        r.count('backtracks');
        snap([{ kind: 'notfound', index: row * n + c }], 4, `No safe square in row ${row + 2}: remove the queen from row ${row + 1}, column ${c + 1} and try the next column.`);
      }
      return false;
    };
    const ok = place(0);
    snap(col.map((c, row) => ({ kind: 'found' as const, index: row * n + c })), 0, ok ? `Solved: ${n} queens placed with no attacks.` : steps > STEP_CAP ? 'Step limit reached before a solution was found.' : `No solution exists for a ${n}x${n} board.`);
    return r.steps;
  },
});

/** Digits of a Sudoku puzzle string, validated. */
function parseSudoku(text: string): number[] {
  const s = text.replace(/\s+/g, '').replace(/[._]/g, '0');
  if (!/^[0-9]{81}$/.test(s)) throw new InputError('Enter exactly 81 characters: digits 1-9, and 0 or . for blanks.');
  const g = [...s].map(Number);
  /** True when the digit at i does not clash with another in its row, column, or box. */
  const clash = (i: number) => {
    for (let j = 0; j < 81; j++) {
      if (j === i || g[j] !== g[i]) continue;
      const same = Math.floor(i / 9) === Math.floor(j / 9) || i % 9 === j % 9 || (Math.floor(i / 27) === Math.floor(j / 27) && Math.floor((i % 9) / 3) === Math.floor((j % 9) / 3));
      if (same) return true;
    }
    return false;
  };
  for (let i = 0; i < 81; i++) if (g[i] && clash(i)) throw new InputError(`The digit at row ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1} clashes with another in its row, column, or box.`);
  return g;
}

/** Sudoku puzzles offered by the random button. */
const PUZZLES = [
  '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
  '200080300060070084030500209000105408000000000402706000301007040720040060004010003',
  '000000907000420180000705026100904000050000040000507009920108000034059000507000000',
  '030050040008010500460000012070502080000603000040109030250000098001020600080060020',
];

/** Sudoku solver. */
export const sudoku = defineForm({
  id: 'sudoku',
  name: 'Sudoku Solver',
  family: 'classics',
  group: 'Backtracking',
  summary: 'Fills the first blank cell with the lowest digit that fits, moves on, and backs up when a cell has no legal digit.',
  complexity: { best: 'O(n²)', average: 'O(9^m)', worst: 'O(9^m)', space: 'O(m)' },
  pseudocode: ['find the first blank cell; if none: solved', 'for digit 1 to 9', '  if the digit is not in the cell’s row, column, or box', '    write it and solve the rest', '    if that failed: erase it (backtrack)', 'return false'],
  form: [{ key: 'puzzle', label: 'Puzzle (81 characters, 0 or . is blank)', type: 'text', default: PUZZLES[0], maxLength: 100 }],
  randomize: (seed) => ({ puzzle: PUZZLES[seed % PUZZLES.length] }),
  randomLabel: 'Another puzzle',
  view: 'grid',
  run(input) {
    const g = parseSudoku(str(input, 'puzzle'));
    const fixed = g.map((v) => v !== 0);
    const r = new Rec<GridState>(['tries', 'backtracks']);
    let steps = 0;
    /** Draws the board. */
    const snap = (marks: Mark[], line: number, explain: string) => {
      steps++;
      r.snap({ rows: 9, cols: 9, walls: Array(81).fill(false), text: g.map((v) => (v ? String(v) : '')), fixed, block: 3 }, marks, line, explain);
    };
    /** True when digit d may go in cell i. */
    const legal = (i: number, d: number) => {
      for (let k = 0; k < 9; k++) if (g[Math.floor(i / 9) * 9 + k] === d || g[k * 9 + (i % 9)] === d) return false;
      const br = Math.floor(i / 27) * 3;
      const bc = Math.floor((i % 9) / 3) * 3;
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (g[(br + a) * 9 + bc + b] === d) return false;
      return true;
    };
    snap([], 0, `${g.filter((v) => !v).length} blank cells to fill.`);
    /** Solves from the first blank cell onward. */
    const solve = (): boolean => {
      r.enter();
      const ok = solveBody();
      r.leave();
      return ok;
    };
    /** Fills the first blank cell, then recurses. */
    const solveBody = (): boolean => {
      const i = g.indexOf(0);
      if (i < 0) return true;
      for (let d = 1; d <= 9; d++) {
        if (steps > STEP_CAP) return false;
        if (!legal(i, d)) continue;
        g[i] = d;
        r.count('tries');
        snap([{ kind: 'active', index: i }], 3, `Try ${d} in row ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1}.`);
        if (solve()) return true;
        g[i] = 0;
        r.count('backtracks');
        snap([{ kind: 'delete', index: i }], 4, `Dead end below: erase ${d} from row ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1} and try a larger digit.`);
      }
      return false;
    };
    const ok = solve();
    snap([], 0, ok ? 'Solved: every row, column, and box holds 1 to 9 once.' : steps > STEP_CAP ? `Step limit (${STEP_CAP}) reached. This puzzle needs too many backtracks to animate in full.` : 'This puzzle has no solution.');
    return r.steps;
  },
});

/** Tower of Hanoi. */
export const hanoi = defineForm({
  id: 'tower-of-hanoi',
  name: 'Tower of Hanoi',
  family: 'classics',
  group: 'Recursion',
  summary: 'Moves a stack of disks from one peg to another, one disk at a time, never putting a larger disk on a smaller one.',
  complexity: { best: 'O(2ⁿ)', average: 'O(2ⁿ)', worst: 'O(2ⁿ)', space: 'O(n)' },
  pseudocode: ['move(n, from, to, spare)', '  if n == 0: return', '  move(n-1, from, spare, to)', '  move disk n from `from` to `to`', '  move(n-1, spare, to, from)'],
  form: [{ key: 'n', label: 'Disks', type: 'int', default: 4, min: 1, max: 6 }],
  randomize: (seed) => ({ n: String(2 + (seed % 5)) }),
  scale: { sizes: [1, 2, 3, 4, 5, 6], unit: 'disks', shapes: [shape('tower', 'n disks')], make: (n) => ({ n }), sizeOf: (i) => int(i, 'n') },
  view: 'hanoi',
  run(input) {
    const n = int(input, 'n');
    const pegs: number[][] = [Array.from({ length: n }, (_, i) => n - i), [], []];
    const r = new Rec<HanoiState>(['moves']);
    const names = ['A', 'B', 'C'];
    /** Draws the pegs. */
    const snap = (marks: Mark[], line: number | null, explain: string) => r.snap({ pegs: pegs.map((p) => [...p]), n }, marks, line, explain);
    snap([], 0, `Move ${n} disk${n === 1 ? '' : 's'} from peg A to peg C. That takes ${2 ** n - 1} moves.`);
    /** Recursive solution. */
    const move = (k: number, from: number, to: number, spare: number): void => {
      if (k === 0) return;
      r.enter();
      move(k - 1, from, spare, to);
      const disk = pegs[from].pop() as number;
      pegs[to].push(disk);
      r.count('moves');
      snap([{ kind: 'swap', index: disk }], 3, `Move disk ${disk} from ${names[from]} to ${names[to]}.`);
      move(k - 1, spare, to, from);
      r.leave();
    };
    move(n, 0, 2, 1);
    snap([], null, `Done in ${2 ** n - 1} moves: the whole tower is on peg C.`);
    return r.steps;
  },
});

/** Permutations by swapping. */
export const permutations = defineForm({
  id: 'permutations',
  name: 'Permutations',
  family: 'classics',
  group: 'Backtracking',
  summary: 'Builds every ordering by fixing one position at a time and swapping each remaining item into it.',
  complexity: { best: 'O(n·n!)', average: 'O(n·n!)', worst: 'O(n·n!)', space: 'O(n)' },
  pseudocode: ['permute(k): if k == n: record the arrangement', 'for each i from k to n-1', '  swap items k and i', '  permute(k + 1)', '  swap them back (undo)'],
  form: [{ key: 'items', label: 'Items', type: 'numbers', default: '1, 2, 3', max: 5 }],
  randomize: (seed) => ({ items: Array.from({ length: 3 + (seed % 2) }, (_, i) => i + 1 + (seed % 3)).join(', ') }),
  scale: { sizes: [1, 2, 3, 4, 5], unit: 'items', shapes: [shape('items', 'n items')], make: (n) => ({ items: Array.from({ length: n }, (_, i) => i + 1) }), sizeOf: (i) => nums(i, 'items').length },
  view: 'cells',
  run(input) {
    const a = nums(input, 'items');
    if (!a.length) throw new InputError('Enter at least one item.');
    const n = a.length;
    const t = new Table(1, n, ['permutations found'], ['current'], a.map((_, i) => `slot ${i + 1}`));
    a.forEach((v, i) => t.set(0, i, v));
    const found: string[] = [];
    t.snap([], 0, `${n}! = ${[...Array(n)].reduce((f, _, i) => f * (i + 1), 1)} orderings to generate.`);
    /** Fixes slot k and permutes the rest. */
    const permute = (k: number): void => {
      t.rec.enter();
      permuteBody(k);
      t.rec.leave();
    };
    /** Body of one call. */
    const permuteBody = (k: number): void => {
      if (k === n) {
        found.push(a.join(''));
        t.rec.count('permutations found');
        t.snap(a.map((_, i) => cellMark(t, 'found', 0, i)), 0, `Arrangement #${found.length}: ${a.join(' ')}.`, `Found so far: ${found.slice(-8).join(', ')}${found.length > 8 ? ' ...' : ''}`);
        return;
      }
      for (let i = k; i < n; i++) {
        [a[k], a[i]] = [a[i], a[k]];
        a.forEach((v, s) => t.set(0, s, v));
        t.snap([cellMark(t, 'swap', 0, k), cellMark(t, 'swap', 0, i)], 2, `Fix slot ${k + 1}: swap item ${a[i]} and ${a[k]}.`);
        permute(k + 1);
        [a[k], a[i]] = [a[i], a[k]];
        a.forEach((v, s) => t.set(0, s, v));
      }
    };
    permute(0);
    t.snap([], 0, `Done: ${found.length} permutations.`, `All ${found.length}: ${found.join(', ')}`);
    return t.steps;
  },
});

/** Subsets (power set) by include/exclude decisions. */
export const subsets = defineForm({
  id: 'subsets',
  name: 'Subsets (Power Set)',
  family: 'classics',
  group: 'Backtracking',
  summary: 'For each item decide: leave it out or put it in. Every path through the decisions is one subset.',
  complexity: { best: 'O(n·2ⁿ)', average: 'O(n·2ⁿ)', worst: 'O(n·2ⁿ)', space: 'O(n)' },
  pseudocode: ['choose(i): if i == n: record the chosen items', 'skip item i: choose(i + 1)', 'take item i: mark it chosen; choose(i + 1)', 'unmark item i (undo)'],
  form: [{ key: 'items', label: 'Items', type: 'numbers', default: '1, 2, 3', max: 5 }],
  randomize: (seed) => ({ items: Array.from({ length: 3 + (seed % 2) }, (_, i) => 1 + ((seed * 5 + i * 3) % 9)).join(', ') }),
  scale: { sizes: [1, 2, 3, 4, 5], unit: 'items', shapes: [shape('items', 'n items')], make: (n) => ({ items: Array.from({ length: n }, (_, i) => i + 1) }), sizeOf: (i) => nums(i, 'items').length },
  view: 'cells',
  run(input) {
    const a = nums(input, 'items');
    if (!a.length) throw new InputError('Enter at least one item.');
    const n = a.length;
    const t = new Table(2, n, ['subsets found'], ['item', 'in subset?'], a.map((_, i) => `#${i + 1}`));
    a.forEach((v, i) => (t.set(0, i, v), t.set(1, i, '·')));
    const found: string[] = [];
    t.snap([], 0, `${n} items make ${2 ** n} subsets.`);
    /** Decides item i. */
    const choose = (i: number): void => {
      t.rec.enter();
      chooseBody(i);
      t.rec.leave();
    };
    /** Body of one decision. */
    const chooseBody = (i: number): void => {
      if (i === n) {
        const s = a.filter((_, k) => t.get(1, k) === 'yes');
        found.push(`{${s.join(' ')}}`);
        t.rec.count('subsets found');
        t.snap(a.map((_, k) => cellMark(t, t.get(1, k) === 'yes' ? 'found' : 'notfound', 1, k)), 0, `Subset #${found.length}: {${s.join(', ')}}.`, `Found: ${found.slice(-8).join(' ')}${found.length > 8 ? ' ...' : ''}`);
        return;
      }
      t.set(1, i, 'no');
      t.snap([cellMark(t, 'active', 1, i)], 1, `Leave out item ${a[i]}.`);
      choose(i + 1);
      t.set(1, i, 'yes');
      t.snap([cellMark(t, 'active', 1, i)], 2, `Take item ${a[i]}.`);
      choose(i + 1);
      t.set(1, i, '·');
    };
    choose(0);
    t.snap([], 0, `Done: ${found.length} subsets, including the empty one.`, `All: ${found.join(' ')}`);
    return t.steps;
  },
});

/** Subset sum by backtracking with pruning. */
export const subsetSum = defineForm({
  id: 'subset-sum',
  name: 'Subset Sum',
  family: 'classics',
  group: 'Backtracking',
  summary: 'Searches for items that add up to the target. It stops going down a branch as soon as the running sum overshoots.',
  complexity: { best: 'O(n)', average: 'O(2ⁿ)', worst: 'O(2ⁿ)', space: 'O(n)' },
  pseudocode: ['search(i, sum): if sum == target: found', 'if i == n or sum > target: give up on this branch (prune)', 'take item i: search(i + 1, sum + item)', 'skip item i: search(i + 1, sum)'],
  form: [
    { key: 'items', label: 'Items (positive)', type: 'numbers', default: '3, 34, 4, 12, 5, 2', max: 8 },
    { key: 'target', label: 'Target sum', type: 'int', default: 9, min: 1, max: 200 },
  ],
  randomize: (seed) => ({ items: Array.from({ length: 6 }, (_, i) => 1 + ((seed * 11 + i * 7) % 15)).join(', '), target: String(8 + (seed % 12)) }),
  scale: { sizes: spread(1, 8), unit: 'items', shapes: [shape('unreachable', 'Target cannot be reached (full search)'), shape('reachable', 'Target reachable', 3)], make: (n, s, seed) => { const items = Array.from({ length: n }, (_, i) => 1 + ((seed * 11 + i * 7) % 15)); const sum = items.reduce((a, b) => a + b, 0); return { items, target: s === 'unreachable' ? Math.min(sum + 1, 200) : items.filter((_, i) => (i + seed) % 2 === 0).reduce((a, b) => a + b, 0) || items[0] }; }, sizeOf: (i) => nums(i, 'items').length },
  view: 'cells',
  run(input) {
    const a = nums(input, 'items');
    const target = int(input, 'target');
    if (!a.length || a.some((x) => x < 1)) throw new InputError('Enter at least one item, all positive.');
    const n = a.length;
    const t = new Table(2, n, ['branches tried'], ['item', 'chosen'], a.map((_, i) => `#${i + 1}`));
    a.forEach((v, i) => (t.set(0, i, v), t.set(1, i, '·')));
    t.snap([], 0, `Find items that add up to ${target}.`, `Running sum: 0`);
    let solved = false;
    /** Explores from item i with running sum `sum`. */
    const search = (i: number, sum: number): void => {
      if (solved) return;
      t.rec.enter();
      searchBody(i, sum);
      t.rec.leave();
    };
    /** Body of one branch. */
    const searchBody = (i: number, sum: number): void => {
      const cap = `Running sum: ${sum}`;
      if (sum === target) {
        solved = true;
        t.snap(a.map((_, k) => cellMark(t, t.get(1, k) === 'yes' ? 'found' : 'notfound', 1, k)), 0, `The chosen items sum to ${target}: ${a.filter((_, k) => t.get(1, k) === 'yes').join(' + ')}.`, cap);
        return;
      }
      if (i === n || sum > target) {
        t.rec.count('branches tried');
        t.snap([], 1, sum > target ? `Sum ${sum} is over ${target}: prune this branch.` : `Out of items at sum ${sum}: dead end.`, cap);
        return;
      }
      t.set(1, i, 'yes');
      t.rec.count('branches tried');
      t.snap([cellMark(t, 'active', 1, i)], 2, `Take ${a[i]}: sum becomes ${sum + a[i]}.`, `Running sum: ${sum + a[i]}`);
      search(i + 1, sum + a[i]);
      if (solved) return;
      t.set(1, i, 'no');
      t.snap([cellMark(t, 'delete', 1, i)], 3, `Skip ${a[i]} and try without it.`, cap);
      search(i + 1, sum);
      if (!solved) t.set(1, i, '·');
    };
    search(0, 0);
    if (!solved) t.snap([], 1, `No combination of these items adds up to ${target}.`);
    return t.steps;
  },
});
