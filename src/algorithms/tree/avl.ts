import { int, nums } from '../../core/forms';
import type { Mark } from '../../core/step';
import { bstDelete, bstInsert, build } from './bst';
import { BinTree, defineTree, keysInput, type TNode } from './util';

/**
 * Walks from `start` up to the root, updating heights and rotating wherever the balance factor leaves [-1, 1].
 * @param t - the tree
 * @param start - first node to check (parent of the inserted or removed position)
 */
function rebalanceUp(t: BinTree, start: TNode | null): void {
  for (let n = start; n; n = n.parent) {
    t.update(n);
    const bf = t.balance(n);
    t.snap([{ kind: 'active', index: n.uid }], 1, `Check ${n.key}: height ${n.h}, balance factor ${bf}.`);
    if (bf > 1) {
      const l = n.left as TNode;
      const kind = t.balance(l) >= 0 ? 'left-left' : 'left-right';
      t.count('rotations');
      t.snap([{ kind: 'delete', index: n.uid }, { kind: 'pivot', index: l.uid }], 2, `${n.key} is left-heavy (${bf}): this is the ${kind} case.`);
      if (t.balance(l) < 0) {
        t.rotateLeft(l);
        t.update(l);
        t.update(l.parent as TNode);
        t.snap([{ kind: 'swap', index: l.uid }], 3, `Rotate ${l.key} left to turn it into a left-left case.`);
      }
      t.rotateRight(n);
      t.update(n);
      t.update(n.parent as TNode);
      t.snap([{ kind: 'swap', index: (n.parent as TNode).uid }], 3, `Rotate ${n.key} right: ${(n.parent as TNode).key} becomes the subtree root.`);
      n = n.parent as TNode;
    } else if (bf < -1) {
      const r = n.right as TNode;
      const kind = t.balance(r) <= 0 ? 'right-right' : 'right-left';
      t.count('rotations');
      t.snap([{ kind: 'delete', index: n.uid }, { kind: 'pivot', index: r.uid }], 2, `${n.key} is right-heavy (${bf}): this is the ${kind} case.`);
      if (t.balance(r) > 0) {
        t.rotateRight(r);
        t.update(r);
        t.update(r.parent as TNode);
        t.snap([{ kind: 'swap', index: r.uid }], 3, `Rotate ${r.key} right to turn it into a right-right case.`);
      }
      t.rotateLeft(n);
      t.update(n);
      t.update(n.parent as TNode);
      t.snap([{ kind: 'swap', index: (n.parent as TNode).uid }], 3, `Rotate ${n.key} left: ${(n.parent as TNode).key} becomes the subtree root.`);
      n = n.parent as TNode;
    }
  }
}

/** Inserts a key and rebalances (used to build the starting tree silently and to animate the insert). */
export function avlInsert(t: BinTree, key: number): void {
  const n = bstInsert(t, key, 0);
  if (n) rebalanceUp(t, n.parent);
}

/** Deletes a key and rebalances. */
export function avlDelete(t: BinTree, key: number): void {
  const at = bstDelete(t, key, 0);
  if (at) rebalanceUp(t, at);
}

const PSEUDO = [
  'insert or delete like an ordinary BST',
  'walk back up: update heights and compute balance factors',
  'if a balance factor is outside [-1, 1]: the node is unbalanced',
  'rotate to fix it (single or double rotation)',
];

/** Keys chosen so inserting 25 triggers a rotation. */
const AVL_KEYS = '10, 20, 30, 40, 50, 60, 70, 15';

/** AVL tree insert. */
export const avlInsertDef = defineTree({
  id: 'avl-insert',
  name: 'AVL Insert',
  group: 'Balanced trees',
  summary: 'A BST that rebalances with rotations after every insert so its height stays O(log n).',
  complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  pseudocode: PSEUDO,
  input: keysInput(AVL_KEYS, 5, 'Key to insert', 'new'),
  run(input) {
    const t = new BinTree(['comparisons', 'rotations'], { balance: true });
    build(t, nums(input, 'keys'), avlInsert);
    t.snap([], 0, `Balanced starting tree. Insert ${int(input, 'value')}.`);
    avlInsert(t, int(input, 'value'));
    t.snap([], null, 'Every node has a balance factor between -1 and 1 again.');
    return t.steps;
  },
});

/** AVL tree delete. */
export const avlDeleteDef = defineTree({
  id: 'avl-delete',
  name: 'AVL Delete',
  group: 'Balanced trees',
  summary: 'Deletes like a BST, then walks up to the root rotating wherever a node became unbalanced.',
  complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  pseudocode: PSEUDO,
  input: keysInput(AVL_KEYS, 15, 'Key to delete'),
  run(input) {
    const t = new BinTree(['comparisons', 'rotations'], { balance: true });
    build(t, nums(input, 'keys'), avlInsert);
    t.snap([], 0, `Balanced starting tree. Delete ${int(input, 'value')}.`);
    avlDelete(t, int(input, 'value'));
    t.snap([], null, 'Every node has a balance factor between -1 and 1 again.');
    return t.steps;
  },
});

/** Marks helper re-exported for tests. */
export type { Mark };
