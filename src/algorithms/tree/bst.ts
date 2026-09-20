import { int, nums } from '../../core/forms';
import type { Mark } from '../../core/step';
import { BinTree, defineTree, keysInput, type TNode } from './util';

/** Default keys shared by the BST algorithms. */
const KEYS = '50, 30, 70, 20, 40, 60, 80, 35, 65';

/**
 * Inserts a key into a binary search tree, recording each comparison.
 * @param t - the tree (silent while building the starting tree)
 * @param key - value to insert
 * @param only - when set, every step highlights this pseudocode line (used when a caller with its own pseudocode reuses this routine)
 * @returns the new node, or null when the key already exists
 */
export function bstInsert(t: BinTree, key: number, only?: number): TNode | null {
  /** Chooses the pseudocode line for a step. */
  const ln = (n: number) => only ?? n;
  if (!t.root) {
    t.root = t.newNode(key);
    t.snap([{ kind: 'insert', index: t.root.uid }], ln(4), `The tree is empty: ${key} becomes the root.`);
    return t.root;
  }
  let n: TNode = t.root;
  for (;;) {
    t.count('comparisons');
    if (key === n.key) {
      t.snap([{ kind: 'found', index: n.uid }], ln(1), `${key} is already in the tree: nothing to insert.`);
      return null;
    }
    const left = key < n.key;
    t.snap([{ kind: 'compare', index: n.uid }], ln(left ? 2 : 3), `${key} ${left ? '<' : '>'} ${n.key}: go ${left ? 'left' : 'right'}.`);
    const next = left ? n.left : n.right;
    if (!next) {
      const nn = t.newNode(key);
      nn.parent = n;
      if (left) n.left = nn;
      else n.right = nn;
      t.snap([{ kind: 'insert', index: nn.uid }], ln(4), `Empty spot found: attach ${key} as the ${left ? 'left' : 'right'} child of ${n.key}.`);
      return nn;
    }
    n = next;
  }
}

/** Builds a tree silently from keys with a given insert routine, then turns recording on. */
export function build(t: BinTree, keys: number[], insert: (t: BinTree, k: number) => unknown): void {
  t.silent = true;
  for (const k of keys) insert(t, k);
  t.silent = false;
}

/** Binary search tree insert. */
export const bstInsertDef = defineTree({
  id: 'bst-insert',
  name: 'BST Insert',
  group: 'Binary search tree',
  summary: 'Walks down from the root, going left for smaller keys and right for larger, until it finds an empty spot.',
  complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n)', space: 'O(1)' },
  pseudocode: ['node = root', 'if key == node.key: stop (already present)', 'if key < node.key: node = node.left', 'else: node = node.right', 'when the child is empty: attach the new node there'],
  input: keysInput(KEYS, 45, 'Key to insert', 'new'),
  run(input) {
    const t = new BinTree(['comparisons']);
    build(t, nums(input, 'keys'), bstInsert);
    t.snap([], 0, `Starting tree with ${t.inorder().length} keys. Insert ${int(input, 'value')}.`);
    bstInsert(t, int(input, 'value'));
    return t.steps;
  },
});

/** Binary search tree search. */
export const bstSearchDef = defineTree({
  id: 'bst-search',
  name: 'BST Search',
  group: 'Binary search tree',
  summary: 'Compares with the current node and discards a whole subtree at every step.',
  complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(n)', space: 'O(1)' },
  pseudocode: ['node = root', 'while node exists', '  if key == node.key: found', '  if key < node.key: node = node.left', '  else: node = node.right', 'not found'],
  input: keysInput(KEYS, 60, 'Key to find'),
  run(input) {
    const t = new BinTree(['comparisons']);
    build(t, nums(input, 'keys'), bstInsert);
    const key = int(input, 'value');
    t.snap([], 0, `Search for ${key}.`);
    let n = t.root;
    while (n) {
      t.count('comparisons');
      if (key === n.key) {
        t.snap([{ kind: 'found', index: n.uid }], 2, `${key} equals ${n.key}: found it.`);
        return t.steps;
      }
      const left = key < n.key;
      t.snap([{ kind: 'compare', index: n.uid }], left ? 3 : 4, `${key} ${left ? '<' : '>'} ${n.key}: go ${left ? 'left' : 'right'}.`);
      n = left ? n.left : n.right;
    }
    t.snap([], 5, `Fell off the tree: ${key} is not present.`);
    return t.steps;
  },
});

/**
 * Deletes a key from a binary search tree, recording each case.
 * @param t - the tree
 * @param key - value to delete
 * @param only - when set, every step highlights this pseudocode line
 * @returns the node whose position changed (where AVL rebalancing should start), or null
 */
export function bstDelete(t: BinTree, key: number, only?: number): TNode | null {
  /** Chooses the pseudocode line for a step. */
  const ln = (n: number) => only ?? n;
  let z = t.root;
  while (z && z.key !== key) {
    t.count('comparisons');
    const left = key < z.key;
    t.snap([{ kind: 'compare', index: z.uid }], ln(0), `${key} ${left ? '<' : '>'} ${z.key}: go ${left ? 'left' : 'right'}.`);
    z = left ? z.left : z.right;
  }
  if (!z) {
    t.snap([], ln(0), `${key} is not in the tree: nothing to delete.`);
    return null;
  }
  const mark: Mark[] = [{ kind: 'delete', index: z.uid }];
  if (z.left && z.right) {
    const s = t.min(z.right);
    t.snap([...mark, { kind: 'pivot', index: s.uid }], ln(3), `${z.key} has two children. Its in-order successor (smallest in the right subtree) is ${s.key}.`);
    z.key = s.key;
    t.snap([{ kind: 'swap', index: z.uid }, { kind: 'delete', index: s.uid }], ln(3), `Copy ${s.key} into the node, then delete the original ${s.key}.`);
    const at = s.parent as TNode;
    t.relink(s, s.right);
    t.snap([], ln(3), `The successor had no left child, so its right child takes its place.`);
    return at;
  }
  const child = z.left ?? z.right;
  const at = z.parent;
  t.relink(z, child);
  t.snap([], ln(child ? 2 : 1), child ? `${key} has one child: that child takes its place.` : `${key} is a leaf: remove it.`);
  return at;
}

/** Binary search tree delete. */
export const bstDeleteDef = defineTree({
  id: 'bst-delete',
  name: 'BST Delete',
  group: 'Binary search tree',
  summary: 'Removes a leaf directly, lifts a lone child, or replaces a two-child node with its in-order successor.',
  complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n)', space: 'O(1)' },
  pseudocode: ['find the node to delete', 'leaf: just remove it', 'one child: replace the node with that child', 'two children: copy the in-order successor here, then delete the successor'],
  input: keysInput(KEYS, 50, 'Key to delete'),
  run(input) {
    const t = new BinTree(['comparisons']);
    build(t, nums(input, 'keys'), bstInsert);
    t.snap([], 0, `Delete ${int(input, 'value')}.`);
    bstDelete(t, int(input, 'value'));
    return t.steps;
  },
});
