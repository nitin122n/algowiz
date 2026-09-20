/** Helpers for algorithms that fill a table (DP, sieve, stack and queue rows). */
import type { Cell, Mark, TableState } from './step';
import { Rec } from './tracer';

/** A table being filled cell by cell, with a step recorder attached. */
export class Table {
  readonly rec: Rec<TableState>;
  readonly cells: Cell[];

  /**
   * @param rows - row count
   * @param cols - column count
   * @param counters - counters to show
   * @param rowLabels - labels down the side
   * @param colLabels - labels across the top
   */
  constructor(
    readonly rows: number,
    readonly cols: number,
    counters: string[],
    readonly rowLabels?: string[],
    readonly colLabels?: string[],
  ) {
    this.rec = new Rec<TableState>(counters);
    this.cells = Array(rows * cols).fill(null);
  }

  /** Flat index of (row, col). */
  at(r: number, c: number): number {
    return r * this.cols + c;
  }

  /** Reads a cell. */
  get(r: number, c: number): Cell {
    return this.cells[this.at(r, c)];
  }

  /** Writes a cell without recording a step. */
  set(r: number, c: number, v: Cell): void {
    this.cells[this.at(r, c)] = v;
  }

  /** The recorded steps. */
  get steps() {
    return this.rec.steps;
  }

  /**
   * Records a frame.
   * @param marks - highlights by flat index
   * @param line - active pseudocode line
   * @param explain - sentence for the frame
   * @param caption - optional text above the table
   */
  snap(marks: Mark[], line: number | null, explain: string, caption?: string): void {
    this.rec.snap({ rows: this.rows, cols: this.cols, cells: [...this.cells], rowLabels: this.rowLabels, colLabels: this.colLabels, caption }, marks, line, explain);
  }
}

/** Shorthand for a mark on table cell (r, c). */
export const cellMark = (t: Table, kind: Mark['kind'], r: number, c: number): Mark => ({ kind, index: t.at(r, c) });
