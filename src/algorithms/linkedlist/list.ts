/**
 * Linked-list operation visualizers. One algorithm is generated per (list kind, operation) pair
 * so each has its own pseudocode and accurate line highlighting.
 */
import type { AlgorithmDef, ListInput, ListKind, ListOp, ListState, Mark, Step } from '../../core/step';

/** One pseudocode line with a key the runner uses to find its index. */
type Code = [key: string, text: string];

/** Human-readable list kind names. */
const KIND_NAME: Record<ListKind, string> = { singly: 'Singly linked list', doubly: 'Doubly linked list', circular: 'Circular linked list' };

/** Records steps for one list operation. */
class Rec {
  readonly steps: Step<ListState>[] = [];
  /** Nodes currently visited (running counter). */
  visited = 0;
  /** Pointer assignments performed (running counter). */
  pointerOps = 0;
  private keys: string[];

  /**
   * @param nodes - starting node values
   * @param kind - list kind, shown in the view
   * @param code - pseudocode for this operation
   */
  constructor(
    public nodes: number[],
    private readonly kind: ListKind,
    code: Code[],
  ) {
    this.keys = code.map((c) => c[0]);
    this.snap([], null, `Start: a ${kind} list with ${nodes.length} node${nodes.length === 1 ? '' : 's'}${nodes.length ? ` (${nodes.join(' → ')})` : ' (empty, head is null)'}.`);
  }

  /** Index of the pseudocode line with the given key, or null when this list kind has no such line. */
  ln(key: string): number | null {
    const i = this.keys.indexOf(key);
    return i < 0 ? null : i;
  }

  /**
   * Pushes a step.
   * @param marks - highlights on node indices
   * @param line - pseudocode line key (see {@link ln}), or null
   * @param explain - sentence for this frame
   * @param nodes - node values to draw; defaults to the current list
   */
  snap(marks: Mark[], line: string | null, explain: string, nodes: number[] = this.nodes): void {
    this.steps.push({
      state: { nodes: [...nodes], kind: this.kind },
      marks,
      line: line === null ? null : this.ln(line),
      explain,
      stats: { visited: this.visited, pointerChanges: this.pointerOps, memory: 0 },
    });
  }

  /**
   * Walks from the head to node `to`, one frame per node.
   * @param to - last index to visit
   * @param line - pseudocode key for each visit
   * @param label - pointer label to draw (default "curr")
   */
  walk(to: number, line: string, label = 'curr'): void {
    for (let i = 0; i <= to; i++) {
      this.visited++;
      this.snap([{ kind: 'pointer', index: i, label }], line, `${label} is at node ${i} (value ${this.nodes[i]}).`);
    }
  }

  /** Finishes with an explanatory step and returns all steps. */
  end(explain: string, marks: Mark[] = [], line: string | null = null, nodes?: number[]): Step<ListState>[] {
    this.snap(marks, line, explain, nodes);
    return this.steps;
  }
}

/** Builds the pseudocode for one (kind, op). Lines specific to a list kind appear only for that kind. */
function codeFor(kind: ListKind, op: ListOp): Code[] {
  const dbl = kind === 'doubly';
  const cir = kind === 'circular';
  /** Includes a pseudocode line only when the list kind needs it. */
  const opt = (cond: boolean, line: Code): Code[] => (cond ? [line] : []);
  const end = cir ? 'head' : 'null';
  switch (op) {
    case 'traverse':
      return [['init', 'curr = head'], ['loop', cir ? 'do' : 'while curr != null'], ['visit', '  visit(curr)'], ['adv', '  curr = curr.next'], ...opt(cir, ['until', 'while curr != head'])];
    case 'search':
      return [['init', 'curr = head'], ['loop', cir ? 'do' : 'while curr != null'], ['cmp', '  if curr.value == value: return curr'], ['adv', '  curr = curr.next'], ...opt(cir, ['until', 'while curr != head']), ['none', 'return null']];
    case 'insert_head':
      return [
        ['new', 'node = new Node(value)'],
        ...opt(cir, ['tail', 'tail = last node (walk from head)']),
        ['next', 'node.next = head'],
        ...opt(dbl, ['prev', 'head.prev = node']),
        ...opt(cir, ['loop', 'tail.next = node']),
        ['head', 'head = node'],
      ];
    case 'insert_tail':
      return [
        ['new', 'node = new Node(value)'],
        ['walk', `curr = head; while curr.next != ${end}: curr = curr.next`],
        ['link', 'curr.next = node'],
        ...opt(dbl, ['prev', 'node.prev = curr']),
        ...opt(cir, ['loop', 'node.next = head']),
      ];
    case 'insert_pos':
      return [
        ['new', 'node = new Node(value)'],
        ['walk', 'curr = node at index pos-1'],
        ['next', 'node.next = curr.next'],
        ...opt(dbl, ['prev', 'node.prev = curr; curr.next.prev = node']),
        ['link', 'curr.next = node'],
      ];
    case 'delete_head':
      return [
        ['victim', 'victim = head'],
        ...opt(cir, ['tail', 'tail = last node (walk from head)']),
        ['move', 'head = head.next'],
        ...opt(dbl, ['prev', 'head.prev = null']),
        ...opt(cir, ['loop', 'tail.next = head']),
        ['free', 'free(victim)'],
      ];
    case 'delete_tail':
      return [
        ['walk', 'curr = second-to-last node'],
        ['victim', 'victim = curr.next'],
        ['cut', `curr.next = ${end}`],
        ['free', 'free(victim)'],
      ];
    case 'delete_pos':
      return [
        ['walk', 'curr = node at index pos-1'],
        ['victim', 'victim = curr.next'],
        ['skip', 'curr.next = victim.next'],
        ...opt(dbl, ['prev', 'victim.next.prev = curr']),
        ['free', 'free(victim)'],
      ];
    case 'reverse':
      return [
        ['init', 'prev = null; curr = head'],
        ['loop', cir ? 'repeat n times' : 'while curr != null'],
        ['save', '  next = curr.next'],
        ['flip', dbl ? '  swap curr.next and curr.prev' : '  curr.next = prev'],
        ['adv', '  prev = curr; curr = next'],
        ['head', 'head = prev'],
      ];
    case 'middle':
      return [
        ['init', 'slow = head; fast = head'],
        ['loop', `while fast != ${end} and fast.next != ${end}`],
        ['adv', '  slow = slow.next; fast = fast.next.next'],
        ['ret', 'return slow'],
      ];
  }
}

/** Display names for operations. */
const OP_NAME: Record<ListOp, string> = {
  traverse: 'Traverse',
  search: 'Search',
  insert_head: 'Insert at Head',
  insert_tail: 'Insert at Tail',
  insert_pos: 'Insert at Position',
  delete_head: 'Delete Head',
  delete_tail: 'Delete Tail',
  delete_pos: 'Delete at Position',
  reverse: 'Reverse',
  middle: 'Find Middle',
};

/** One-sentence summaries for operations. */
const OP_SUMMARY: Record<ListOp, string> = {
  traverse: 'Visits every node from head to the end by following next pointers.',
  search: 'Follows next pointers until a node holds the value, or the list ends.',
  insert_head: 'Creates a node and makes it the new head.',
  insert_tail: 'Walks to the last node and links a new node after it.',
  insert_pos: 'Walks to the node before the position and links a new node in.',
  delete_head: 'Moves the head to the second node and frees the old head.',
  delete_tail: 'Walks to the second-to-last node and cuts off the last node.',
  delete_pos: 'Walks to the node before the position and unlinks the next node.',
  reverse: 'Flips every pointer while walking, so the list ends up backwards.',
  middle: 'Uses a slow and a fast pointer; when fast reaches the end, slow is at the middle.',
};

/** Complexity per operation. */
const OP_COMPLEXITY: Record<ListOp, { best: string; average: string; worst: string; space: string }> = {
  traverse: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  search: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  insert_head: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  insert_tail: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  insert_pos: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  delete_head: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  delete_tail: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  delete_pos: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  reverse: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  middle: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
};

/** Input fields each operation needs beyond the list itself. */
const OP_FIELDS: Record<ListOp, Array<'value' | 'index'>> = {
  traverse: [], search: ['value'], insert_head: ['value'], insert_tail: ['value'], insert_pos: ['value', 'index'],
  delete_head: [], delete_tail: [], delete_pos: ['index'], reverse: [], middle: [],
};

/**
 * Runs one list operation and records every step.
 * @param kind - singly, doubly, or circular
 * @param op - operation to perform
 * @param input - the list plus the operation's value and index
 * @returns the recorded steps
 */
export function runListOp(kind: ListKind, op: ListOp, input: ListInput): Step<ListState>[] {
  const { list, value, index } = input;
  const r = new Rec([...list], kind, codeFor(kind, op));
  const n = list.length;
  /** The list after inserting `v` at position `i`. */
  const nodesWith = (i: number, v: number): number[] => [...list.slice(0, i), v, ...list.slice(i)];
  /** The list after removing the node at position `i`. */
  const nodesWithout = (i: number): number[] => list.filter((_, k) => k !== i);
  const cir = kind === 'circular';
  const dbl = kind === 'doubly';

  switch (op) {
    case 'traverse': {
      if (n === 0) return r.end('The list is empty: head is null, so there is nothing to visit.');
      r.walk(n - 1, 'visit');
      return r.end(cir ? 'curr came back to head, so the traversal is complete.' : 'curr is null: the end of the list. Traversal complete.', [], cir ? 'until' : 'loop');
    }
    case 'search': {
      for (let i = 0; i < n; i++) {
        r.visited++;
        const hit = list[i] === value;
        r.snap([{ kind: hit ? 'found' : 'compare', index: i, label: 'curr' }], 'cmp', `Node ${i} holds ${list[i]}: ${hit ? `that is ${value}, found it!` : `not ${value}, move on.`}`);
        if (hit) return r.steps;
      }
      return r.end(`${value} is not in the list.`, [], 'none');
    }
    case 'insert_head': {
      r.snap([], 'new', `Create a new node holding ${value}.`);
      if (cir && n > 0) r.walk(n - 1, 'tail', 'tail');
      if (n > 0) {
        r.pointerOps++;
        r.snap([{ kind: 'pointer', index: 0, label: 'head' }], 'next', `node.next points at the current head (${list[0]}).`);
      }
      if (dbl && n > 0) {
        r.pointerOps++;
        r.snap([{ kind: 'pointer', index: 0, label: 'head' }], 'prev', 'The old head’s prev now points back at the new node.');
      }
      if (cir && n > 0) {
        r.pointerOps++;
        r.snap([{ kind: 'pointer', index: n - 1, label: 'tail' }], 'loop', 'The tail’s next now points at the new node, keeping the circle closed.');
      }
      r.pointerOps++;
      return r.end(`head now points at the new node ${value}.`, [{ kind: 'insert', index: 0 }], 'head', nodesWith(0, value));
    }
    case 'insert_tail': {
      r.snap([], 'new', `Create a new node holding ${value}.`);
      if (n === 0) return r.end('The list was empty, so the new node becomes the head.', [{ kind: 'insert', index: 0 }], 'link', [value]);
      r.walk(n - 1, 'walk');
      r.pointerOps += 1 + (dbl ? 1 : 0) + (cir ? 1 : 0);
      return r.end(`The last node now points at the new node ${value}${cir ? ', and the new node points back to head' : ''}.`, [{ kind: 'insert', index: n }], 'link', nodesWith(n, value));
    }
    case 'insert_pos': {
      if (index < 0 || index > n) return r.end(`Position ${index} is out of range. Valid positions are 0 to ${n}.`, [], null);
      r.snap([], 'new', `Create a new node holding ${value}.`);
      if (index === 0) {
        r.pointerOps += 2;
        return r.end('Position 0 is the head: the new node links to the old head and becomes the head.', [{ kind: 'insert', index: 0 }], 'link', nodesWith(0, value));
      }
      r.walk(index - 1, 'walk');
      r.pointerOps += 2 + (dbl ? 2 : 0);
      r.snap([{ kind: 'pointer', index: index - 1, label: 'curr' }], 'next', `node.next takes curr.next${index < n ? ` (${list[index]})` : ' (the end)'}.`);
      return r.end(`curr.next now points at the new node ${value}: it sits at index ${index}.`, [{ kind: 'insert', index }], 'link', nodesWith(index, value));
    }
    case 'delete_head': {
      if (n === 0) return r.end('The list is empty: nothing to delete.');
      r.snap([{ kind: 'delete', index: 0, label: 'victim' }], 'victim', `victim = head (value ${list[0]}).`);
      if (cir && n > 1) r.walk(n - 1, 'tail', 'tail');
      r.pointerOps += 1 + (dbl ? 1 : 0) + (cir ? 1 : 0);
      r.snap([{ kind: 'delete', index: 0 }], 'move', n > 1 ? `head moves to the next node (${list[1]}).` : 'That was the only node: head becomes null.');
      return r.end(`Node ${list[0]} is freed.`, [], 'free', nodesWithout(0));
    }
    case 'delete_tail': {
      if (n === 0) return r.end('The list is empty: nothing to delete.');
      if (n === 1) {
        r.snap([{ kind: 'delete', index: 0, label: 'victim' }], 'victim', 'Only one node: it is both head and tail.');
        return r.end(`Node ${list[0]} is freed and head becomes null.`, [], 'free', []);
      }
      r.walk(n - 2, 'walk');
      r.snap([{ kind: 'delete', index: n - 1, label: 'victim' }, { kind: 'pointer', index: n - 2, label: 'curr' }], 'victim', `victim = curr.next (value ${list[n - 1]}).`);
      r.pointerOps++;
      r.snap([{ kind: 'delete', index: n - 1 }], 'cut', cir ? 'curr.next now points back at head.' : 'curr.next = null: the list ends at curr.');
      return r.end(`Node ${list[n - 1]} is freed.`, [], 'free', nodesWithout(n - 1));
    }
    case 'delete_pos': {
      if (index < 0 || index >= n) return r.end(`Position ${index} is out of range. Valid positions are 0 to ${Math.max(n - 1, 0)}${n === 0 ? ' (the list is empty)' : ''}.`);
      if (index === 0) {
        r.snap([{ kind: 'delete', index: 0, label: 'victim' }], 'victim', 'Position 0 is the head: victim = head.');
        r.pointerOps += 1;
        return r.end(`head moves on; node ${list[0]} is freed.`, [], 'free', nodesWithout(0));
      }
      r.walk(index - 1, 'walk');
      r.snap([{ kind: 'delete', index, label: 'victim' }, { kind: 'pointer', index: index - 1, label: 'curr' }], 'victim', `victim = curr.next (value ${list[index]}).`);
      r.pointerOps += 1 + (dbl ? 1 : 0);
      r.snap([{ kind: 'delete', index }], 'skip', `curr.next skips over the victim${index + 1 < n ? ` and points at ${list[index + 1]}` : ''}.`);
      return r.end(`Node ${list[index]} is freed.`, [], 'free', nodesWithout(index));
    }
    case 'reverse': {
      if (n < 2) return r.end(n === 0 ? 'The list is empty: nothing to reverse.' : 'A single node is already its own reverse.');
      for (let k = 1; k <= n; k++) {
        r.visited++;
        r.pointerOps++;
        const shown = [...list.slice(0, k).reverse(), ...list.slice(k)];
        r.snap(
          [...Array.from({ length: k }, (_, i) => ({ kind: 'insert' as const, index: i })), ...(k < n ? [{ kind: 'pointer' as const, index: k, label: 'curr' }] : [])],
          'flip',
          `Flip node ${list[k - 1]}’s pointer to face backwards. The first ${k} node${k === 1 ? ' is' : 's are'} now reversed.`,
          shown,
        );
      }
      return r.end('All pointers are flipped; head now points at the old tail.', [], 'head', [...list].reverse());
    }
    case 'middle': {
      if (n === 0) return r.end('The list is empty: there is no middle.');
      let slow = 0;
      let fast = 0;
      r.snap([{ kind: 'pointer', index: 0, label: 'slow' }, { kind: 'pointer', index: 0, label: 'fast' }], 'init', 'Both pointers start at head.');
      // fast has a next node while fast + 1 < n; fast === n means it walked off the end.
      while (fast + 1 < n) {
        slow++;
        fast += 2;
        r.visited += 2;
        const marks: Mark[] = [{ kind: 'pointer', index: slow, label: 'slow' }];
        if (fast < n) marks.push({ kind: 'pointer', index: fast, label: 'fast' });
        r.snap(marks, 'adv', fast < n ? 'slow moves 1 step, fast moves 2 steps.' : 'slow moves 1 step; fast moves 2 and falls off the end.');
      }
      return r.end(`fast reached the end, so slow is at the middle: index ${slow} (value ${list[slow]}).`, [{ kind: 'found', index: slow, label: 'middle' }], 'ret');
    }
  }
}

/**
 * Builds the definition for one (kind, op) pair.
 * @param kind - list kind
 * @param op - operation
 * @returns a registry-ready definition using the list view
 */
export function defineListOp(kind: ListKind, op: ListOp): AlgorithmDef<ListInput, ListState> {
  return {
    id: `${kind}-${op.replace('_', '-')}`,
    name: `${OP_NAME[op]}`,
    family: 'linkedlist',
    group: KIND_NAME[kind],
    summary: OP_SUMMARY[op],
    complexity: OP_COMPLEXITY[op],
    pseudocode: codeFor(kind, op).map((c) => c[1]),
    theory: { notes: [`List type: ${KIND_NAME[kind]}.`, OP_SUMMARY[op]] },
    input: { kind: 'list', maxSize: 12, defaultSize: 5, fields: OP_FIELDS[op] },
    run: (input) => runListOp(kind, op, input),
    view: 'list',
  };
}
