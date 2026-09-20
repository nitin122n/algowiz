import { InputError, str } from '../../core/forms';
import type { Mark } from '../../core/step';
import { Table } from '../../core/table';
import { shape, spread } from '../../core/scale';
import { defineForm } from '../define';

/** Slots drawn for a stack, queue, or deque. */
const CAP = 8;

/** One parsed operation. */
interface Op {
  name: string;
  value?: number;
}

/**
 * Parses "push 5, pop, push 7" style text.
 * @param text - operations separated by commas
 * @param allowed - operation names that need a value, then those that do not
 * @throws InputError for unknown operations or a missing or bad value
 */
function parseOps(text: string, withValue: string[], noValue: string[]): Op[] {
  const ops: Op[] = [];
  for (const tok of text.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)) {
    const [name, v] = tok.split(/\s+/);
    if (withValue.includes(name)) {
      if (v === undefined || !Number.isInteger(Number(v))) throw new InputError(`"${tok}" needs a whole number, like "${name} 5".`);
      ops.push({ name, value: Number(v) });
    } else if (noValue.includes(name)) ops.push({ name });
    else throw new InputError(`"${name}" is not an operation. Use: ${[...withValue.map((w) => `${w} <number>`), ...noValue].join(', ')}.`);
  }
  if (!ops.length) throw new InputError('Enter at least one operation.');
  return ops;
}

/** Builds a stack, queue, or deque definition from its operation handlers. */
function structure(opts: {
  id: string;
  name: string;
  summary: string;
  pseudocode: string[];
  ops: string;
  help: string;
  withValue: string[];
  noValue: string[];
  /** Applies one op to the items; returns an explanation, the changed index, and pseudocode line. */
  apply: (items: number[], op: Op) => { explain: string; kind: Mark['kind']; index: number | null; line: number };
  labels: (n: number) => Array<[number, string]>;
  rowLabel: string;
}) {
  return defineForm({
    id: opts.id,
    name: opts.name,
    family: 'classics',
    group: 'Data structures',
    summary: opts.summary,
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(n)' },
    pseudocode: opts.pseudocode,
    form: [{ key: 'ops', label: 'Operations', type: 'text', default: opts.ops, help: opts.help, maxLength: 120 }],
    scale: {
      sizes: spread(2, 16),
      unit: 'operations',
      shapes: [shape('fill', 'Add n/2 items, then remove them')],
      make: (n) => {
        const [add, remove] = [opts.withValue[opts.withValue.length - 1], opts.noValue[0]];
        const half = Math.min(Math.floor(n / 2), CAP);
        return { ops: [...Array.from({ length: half }, (_, i) => `${add} ${i + 1}`), ...Array.from({ length: n - half }, () => remove)].join(', ') };
      },
      sizeOf: (i) => str(i, 'ops').split(',').length,
    },
    randomize: (seed) => ({ ops: opts.ops.split(', ').slice(seed % 3).concat(opts.ops.split(', ').slice(0, seed % 3)).join(', ') }),
    view: 'cells',
    run(input) {
      const ops = parseOps(str(input, 'ops'), opts.withValue, opts.noValue);
      const items: number[] = [];
      const t = new Table(1, CAP, ['operations', 'peak size'], [opts.rowLabel], Array.from({ length: CAP }, (_, i) => String(i)));
      /** Copies `items` into the table cells. */
      const sync = () => {
        for (let i = 0; i < CAP; i++) t.set(0, i, i < items.length ? items[i] : null);
      };
      /** Frame builder: adds the end labels (top, front, back). */
      const frame = (marks: Mark[], line: number, explain: string) =>
        t.snap([...marks, ...opts.labels(items.length).map(([index, label]) => ({ kind: 'pointer' as const, index, label }))], line, explain, `Size ${items.length} of ${CAP}`);
      frame([], 0, `Start with an empty ${opts.rowLabel}. ${ops.length} operations to run.`);
      for (const op of ops) {
        const r = opts.apply(items, op);
        t.rec.count('operations');
        t.rec.raise('peak size', items.length);
        t.rec.raise('memory', items.length);
        sync();
        frame(r.index === null ? [] : [{ kind: r.kind, index: r.index }], r.line, r.explain);
      }
      return t.steps;
    },
  });
}

/** Stack: last in, first out. */
export const stack = structure({
  id: 'stack',
  name: 'Stack (LIFO)',
  summary: 'Last in, first out. Push and pop both work at the top, so the newest item is always the next one out.',
  pseudocode: ['push(x): if the stack is full: overflow, else place x on top', 'pop(): if the stack is empty: underflow, else remove and return the top'],
  ops: 'push 5, push 8, push 2, pop, push 9, pop, pop',
  help: 'Use push <number> and pop, separated by commas.',
  withValue: ['push'],
  noValue: ['pop'],
  rowLabel: 'stack',
  labels: (n) => (n ? [[n - 1, 'top']] : []),
  apply(items, op) {
    if (op.name === 'push') {
      if (items.length >= CAP) return { explain: `push ${op.value}: the stack is full (overflow), nothing changes.`, kind: 'delete', index: CAP - 1, line: 0 };
      items.push(op.value as number);
      return { explain: `push ${op.value}: it goes on top.`, kind: 'insert', index: items.length - 1, line: 0 };
    }
    if (!items.length) return { explain: 'pop: the stack is empty (underflow), nothing to remove.', kind: 'delete', index: null, line: 1 };
    const v = items.pop() as number;
    return { explain: `pop: remove and return ${v}, the most recent item.`, kind: 'delete', index: items.length, line: 1 };
  },
});

/** Queue: first in, first out. */
export const queue = structure({
  id: 'queue',
  name: 'Queue (FIFO)',
  summary: 'First in, first out. Items join at the back and leave from the front, like a line of people.',
  pseudocode: ['enqueue(x): if the queue is full: overflow, else add x at the back', 'dequeue(): if the queue is empty: underflow, else remove and return the front'],
  ops: 'enqueue 5, enqueue 8, enqueue 2, dequeue, enqueue 9, dequeue, dequeue',
  help: 'Use enqueue <number> and dequeue, separated by commas.',
  withValue: ['enqueue'],
  noValue: ['dequeue'],
  rowLabel: 'queue',
  labels: (n) => (n ? (n === 1 ? [[0, 'front/back']] : [[0, 'front'], [n - 1, 'back']]) : []),
  apply(items, op) {
    if (op.name === 'enqueue') {
      if (items.length >= CAP) return { explain: `enqueue ${op.value}: the queue is full (overflow), nothing changes.`, kind: 'delete', index: CAP - 1, line: 0 };
      items.push(op.value as number);
      return { explain: `enqueue ${op.value}: it joins the back of the line.`, kind: 'insert', index: items.length - 1, line: 0 };
    }
    if (!items.length) return { explain: 'dequeue: the queue is empty (underflow), nothing to remove.', kind: 'delete', index: null, line: 1 };
    const v = items.shift() as number;
    return { explain: `dequeue: remove and return ${v}, the item that waited longest. Everyone else moves up one slot.`, kind: 'delete', index: 0, line: 1 };
  },
});

/** Deque: double-ended queue. */
export const deque = structure({
  id: 'deque',
  name: 'Deque (Double-Ended Queue)',
  summary: 'A queue you can add to and remove from at both ends, so it works as a stack or a queue.',
  pseudocode: ['push_front(x) / push_back(x): add x at that end (overflow if full)', 'pop_front() / pop_back(): remove and return the item at that end (underflow if empty)'],
  ops: 'push_back 5, push_back 8, push_front 2, pop_back, push_front 9, pop_front, pop_front',
  help: 'Use push_front <n>, push_back <n>, pop_front, pop_back.',
  withValue: ['push_front', 'push_back'],
  noValue: ['pop_front', 'pop_back'],
  rowLabel: 'deque',
  labels: (n) => (n ? (n === 1 ? [[0, 'front/back']] : [[0, 'front'], [n - 1, 'back']]) : []),
  apply(items, op) {
    const front = op.name.endsWith('front');
    if (op.name.startsWith('push')) {
      if (items.length >= CAP) return { explain: `${op.name} ${op.value}: the deque is full (overflow), nothing changes.`, kind: 'delete', index: CAP - 1, line: 0 };
      if (front) items.unshift(op.value as number);
      else items.push(op.value as number);
      return { explain: `${op.name} ${op.value}: added at the ${front ? 'front' : 'back'}.`, kind: 'insert', index: front ? 0 : items.length - 1, line: 0 };
    }
    if (!items.length) return { explain: `${op.name}: the deque is empty (underflow), nothing to remove.`, kind: 'delete', index: null, line: 1 };
    const v = (front ? items.shift() : items.pop()) as number;
    return { explain: `${op.name}: removed ${v} from the ${front ? 'front' : 'back'}.`, kind: 'delete', index: front ? 0 : items.length, line: 1 };
  },
});
