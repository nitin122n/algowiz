/** Shared tree plumbing: a parent-linked binary node, a recorder with silent mode, and form helpers. */
import { mulberry32 } from '../../core/random';
import type { AlgorithmDef, Complexity, FieldSpec, FormInput, Mark, ScaleSpec, Step, TreeNode, TreeState } from '../../core/step';
import { shape, spread } from '../../core/scale';
import { Rec } from '../../core/tracer';
import { theoryFor } from '../theory';

/** A binary tree node with a parent link (needed for rotations and delete). */
export class TNode {
  left: TNode | null = null;
  right: TNode | null = null;
  parent: TNode | null = null;
  /** Subtree height (AVL). */
  h = 1;
  color: 'red' | 'black' = 'red';

  /**
   * @param uid - stable id used by marks
   * @param key - stored value
   */
  constructor(
    readonly uid: number,
    public key: number,
  ) {}
}

/** Which extra captions to draw under nodes. */
export interface ShowOpts {
  /** AVL: show the balance factor. */
  balance?: boolean;
  /** Red-black: color nodes red or black. */
  color?: boolean;
}

/**
 * A binary tree that records steps. While `silent` is true no steps are recorded,
 * so the same insert routine builds the starting tree and animates the real operation.
 */
export class BinTree {
  root: TNode | null = null;
  silent = true;
  /** Optional caption per node uid; overrides the default caption (traversal order numbers). */
  readonly tags = new Map<number, string>();
  private nextUid = 0;
  readonly rec: Rec<TreeState>;

  /**
   * @param counters - names of counters to show
   * @param show - captions to draw
   */
  constructor(
    counters: string[],
    readonly show: ShowOpts = {},
  ) {
    this.rec = new Rec<TreeState>(counters);
    // Insert, search, delete, and rebalancing here are iterative: constant extra memory unless a caller adds more.
    this.rec.raise('memory', 0);
  }

  /** The recorded steps. */
  get steps(): Step<TreeState>[] {
    return this.rec.steps;
  }

  /** Increases a counter (ignored while silent). */
  count(name: string, by = 1): void {
    if (!this.silent) this.rec.count(name, by);
  }

  /** Creates a node with a fresh id. */
  newNode(key: number): TNode {
    return new TNode(this.nextUid++, key);
  }

  /** Height of a possibly missing node. */
  height(n: TNode | null): number {
    return n ? n.h : 0;
  }

  /** Recomputes a node's height from its children. */
  update(n: TNode): void {
    n.h = 1 + Math.max(this.height(n.left), this.height(n.right));
  }

  /** Balance factor: left height minus right height. */
  balance(n: TNode): number {
    return this.height(n.left) - this.height(n.right);
  }

  /** Rotates x down to the left; its right child takes its place. */
  rotateLeft(x: TNode): void {
    const y = x.right as TNode;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    this.relink(x, y);
    y.left = x;
    x.parent = y;
  }

  /** Rotates x down to the right; its left child takes its place. */
  rotateRight(x: TNode): void {
    const y = x.left as TNode;
    x.left = y.right;
    if (y.right) y.right.parent = x;
    this.relink(x, y);
    y.right = x;
    x.parent = y;
  }

  /** Puts `y` where `x` hung (used by rotations and delete). */
  relink(x: TNode, y: TNode | null): void {
    if (y) y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
  }

  /** Smallest node under `n`. */
  min(n: TNode): TNode {
    while (n.left) n = n.left;
    return n;
  }

  /** Keys in sorted order. */
  inorder(n: TNode | null = this.root, out: number[] = []): number[] {
    if (n) {
      this.inorder(n.left, out);
      out.push(n.key);
      this.inorder(n.right, out);
    }
    return out;
  }

  /** Builds the drawable snapshot. */
  state(): TreeState {
    const nodes: Record<number, TreeNode> = {};
    const walk = (n: TNode | null): void => {
      if (!n) return;
      nodes[n.uid] = {
        label: String(n.key),
        children: [n.left?.uid ?? null, n.right?.uid ?? null],
        color: this.show.color ? n.color : undefined,
        sub: this.tags.get(n.uid) ?? (this.show.balance ? `bf ${this.balance(n)}` : undefined),
      };
      walk(n.left);
      walk(n.right);
    };
    walk(this.root);
    return { nodes, roots: this.root ? [this.root.uid] : [], binary: true };
  }

  /**
   * Records a frame (does nothing while silent).
   * @param marks - highlights keyed by node uid
   * @param line - active pseudocode line
   * @param explain - sentence for the frame
   */
  snap(marks: Mark[], line: number | null, explain: string): void {
    if (this.silent) return;
    this.rec.snap(this.state(), marks, line, explain);
  }
}

/** Largest number of starting keys the tree forms accept. */
export const MAX_KEYS = 14;

/**
 * Form fields for algorithms that start from a key list and then apply one operation.
 * @param keys - default starting keys
 * @param value - default value for the operation, or null for no value field
 * @param valueLabel - label of the value field
 * @param valueMode - what the Complexity Lab uses as the value: a key not yet in the tree, or an existing key
 * @returns form, random generator, and scaling recipe
 */
export function keysInput(keys: string, value: number | null, valueLabel = 'Value', valueMode: 'new' | 'existing' = 'existing'): { form: FieldSpec[]; randomize: (seed: number) => Record<string, string>; scale: ScaleSpec<FormInput> } {
  const form: FieldSpec[] = [{ key: 'keys', label: 'Starting keys', type: 'numbers', default: keys, max: MAX_KEYS, help: 'Inserted one by one, in this order, before the operation. Duplicates are ignored.' }];
  if (value !== null) form.push({ key: 'value', label: valueLabel, type: 'int', default: value });
  return {
    form,
    randomize: (seed) => {
      const rnd = mulberry32(seed * 31 + 7);
      const n = 6 + (seed % 5);
      const pool = Array.from({ length: 99 }, (_, i) => i + 1);
      const picked = Array.from({ length: n }, () => pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
      // Half the time operate on an existing key, half on a new one.
      const v = rnd() < 0.5 ? picked[Math.floor(rnd() * n)] : pool[Math.floor(rnd() * pool.length)];
      return { keys: picked.join(', '), value: String(v) };
    },
    scale: {
      sizes: spread(1, MAX_KEYS),
      unit: 'keys',
      shapes: [shape('random', 'Keys in random order', 3), shape('sorted', 'Keys in sorted order')],
      make: (n, s, seed) => {
        const keys = Array.from({ length: n }, (_, i) => 10 * (i + 1));
        const rnd = mulberry32(seed * 131 + n);
        if (s === 'random') for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          [keys[i], keys[j]] = [keys[j], keys[i]];
        }
        // The deepest key of a sorted insert order is the largest one.
        const v = valueMode === 'new' ? (s === 'sorted' ? 10 * (n + 1) : 10 * Math.floor(rnd() * (n + 1)) + 5) : s === 'sorted' ? 10 * n : keys[Math.floor(rnd() * n)];
        return { keys, value: v };
      },
      sizeOf: (i) => new Set(i.keys as number[]).size,
    },
  };
}

/** Fields a tree file provides. */
export interface TreeSpec {
  id: string;
  name: string;
  group: string;
  summary: string;
  complexity: Complexity;
  pseudocode: string[];
  input: ReturnType<typeof keysInput>;
  run: (input: FormInput) => Step<TreeState>[];
}

/**
 * Builds a definition for a tree algorithm.
 * @param s - algorithm-specific fields
 */
export function defineTree(s: TreeSpec): AlgorithmDef<FormInput, TreeState> {
  return {
    id: s.id,
    name: s.name,
    family: 'tree',
    group: s.group,
    summary: s.summary,
    complexity: s.complexity,
    pseudocode: s.pseudocode,
    theory: theoryFor(s.id),
    input: { kind: 'form', maxSize: 100, defaultSize: 0, form: s.input.form, randomize: s.input.randomize },
    run: s.run,
    view: 'tree',
    scale: s.input.scale,
  };
}
