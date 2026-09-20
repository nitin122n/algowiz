import { int, nums } from '../../core/forms';
import { bstInsert, build } from './bst';
import { BinTree, defineTree, keysInput, type TNode } from './util';

/**
 * Inserts a key into a red-black tree and repairs violations (CLRS insert fixup).
 * @param t - the tree
 * @param key - value to insert
 */
export function rbInsert(t: BinTree, key: number): void {
  const z = bstInsert(t, key, 0);
  if (!z) return;
  z.color = 'red';
  t.snap([{ kind: 'insert', index: z.uid }], 0, `${key} is inserted as a red node.`);
  let n: TNode = z;
  while (n.parent && n.parent.color === 'red') {
    const p = n.parent;
    const g = p.parent as TNode; // a red parent is never the root, so a grandparent exists
    const parentIsLeft = p === g.left;
    const uncle = parentIsLeft ? g.right : g.left;
    if (uncle && uncle.color === 'red') {
      t.count('recolors');
      p.color = 'black';
      uncle.color = 'black';
      g.color = 'red';
      t.snap([{ kind: 'swap', index: p.uid }, { kind: 'swap', index: uncle.uid }, { kind: 'pivot', index: g.uid }], 2, `Parent ${p.key} and uncle ${uncle.key} are both red: recolor them black and ${g.key} red, then continue from ${g.key}.`);
      n = g;
      continue;
    }
    t.snap([{ kind: 'delete', index: p.uid }, { kind: 'pivot', index: g.uid }], 3, `Parent ${p.key} is red and the uncle is black: rotations are needed.`);
    if (parentIsLeft) {
      if (n === p.right) {
        t.count('rotations');
        n = p;
        t.rotateLeft(n);
        t.snap([{ kind: 'swap', index: n.uid }], 3, `${n.key} is an inner child: rotate ${n.key} left to line it up.`);
      }
      const np = n.parent as TNode;
      np.color = 'black';
      g.color = 'red';
      t.count('rotations');
      t.rotateRight(g);
      t.snap([{ kind: 'swap', index: np.uid }, { kind: 'swap', index: g.uid }], 4, `Recolor ${np.key} black and ${g.key} red, then rotate ${g.key} right.`);
    } else {
      if (n === p.left) {
        t.count('rotations');
        n = p;
        t.rotateRight(n);
        t.snap([{ kind: 'swap', index: n.uid }], 3, `${n.key} is an inner child: rotate ${n.key} right to line it up.`);
      }
      const np = n.parent as TNode;
      np.color = 'black';
      g.color = 'red';
      t.count('rotations');
      t.rotateLeft(g);
      t.snap([{ kind: 'swap', index: np.uid }, { kind: 'swap', index: g.uid }], 4, `Recolor ${np.key} black and ${g.key} red, then rotate ${g.key} left.`);
    }
  }
  const root = t.root as TNode;
  if (root.color === 'red') {
    root.color = 'black';
    t.snap([{ kind: 'swap', index: root.uid }], 5, 'The root must be black: recolor it.');
  }
}

/** Red-black tree insert. */
export const rbInsertDef = defineTree({
  id: 'red-black-insert',
  name: 'Red-Black Insert',
  group: 'Balanced trees',
  summary: 'Inserts a red node, then recolors and rotates to keep no red node with a red child and equal black height on every path.',
  complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  pseudocode: [
    'insert like a BST and color the new node red',
    'while the parent is red',
    '  uncle is red: recolor parent, uncle, grandparent; move up',
    '  uncle is black: rotate (first the inner case, then the outer case)',
    '  recolor parent black and grandparent red after the rotation',
    'color the root black',
  ],
  input: keysInput('10, 20, 30, 15, 25, 5, 1', 40, 'Key to insert', 'new'),
  run(input) {
    const t = new BinTree(['recolors', 'rotations'], { color: true });
    build(t, nums(input, 'keys'), rbInsert);
    t.snap([], 0, `Valid red-black tree. Insert ${int(input, 'value')}.`);
    rbInsert(t, int(input, 'value'));
    t.snap([], null, 'The tree satisfies every red-black rule again.');
    return t.steps;
  },
});
