import { nums } from '../../core/forms';
import type { Mark } from '../../core/step';
import { bstInsert, build } from './bst';
import { BinTree, defineTree, keysInput, type TNode } from './util';

/** Order a traversal visits nodes in. */
type Order = 'in' | 'pre' | 'post' | 'level';

/** Builds a traversal definition. */
function traversal(order: Order, name: string, summary: string, pseudocode: string[]) {
  return defineTree({
    id: `${order}order-traversal`,
    name,
    group: 'Traversals',
    summary,
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: order === 'level' ? 'O(n)' : 'O(h)' },
    pseudocode,
    input: keysInput('50, 30, 70, 20, 40, 60, 80', null),
    run(input) {
      const t = new BinTree(['visited']);
      build(t, nums(input, 'keys'), bstInsert);
      const done = new Set<number>();
      let k = 0;
      /** Marks for the current frame: finished nodes plus optional extras. */
      const marks = (extra: Mark[] = []): Mark[] => [...[...done].map((index) => ({ kind: 'visited' as const, index })), ...extra];
      /** Outputs a node. */
      const visit = (n: TNode, line: number) => {
        done.add(n.uid);
        t.tags.set(n.uid, `#${++k}`);
        t.count('visited');
        t.snap(marks([{ kind: 'found', index: n.uid }]), line, `Visit ${n.key} (number ${k} in the ${order === 'level' ? 'level' : order + '-'}order).`);
      };
      t.snap([], 0, `Traverse the tree in ${order === 'level' ? 'level' : order}order.`);
      /** Recursive depth-first traversal. */
      const walk = (n: TNode | null): void => {
        if (!n) return;
        t.rec.enter();
        t.snap(marks([{ kind: 'pointer', index: n.uid }]), 0, `Arrive at ${n.key}.`);
        if (order === 'pre') visit(n, 1);
        walk(n.left);
        if (order === 'in') visit(n, 2);
        walk(n.right);
        if (order === 'post') visit(n, 3);
        t.rec.leave();
      };
      if (order === 'level') {
        const q = t.root ? [t.root] : [];
        t.rec.alloc(q.length);
        while (q.length) {
          const n = q.shift() as TNode;
          t.rec.free(1);
          visit(n, 2);
          if (n.left) (q.push(n.left), t.rec.alloc(1));
          if (n.right) (q.push(n.right), t.rec.alloc(1));
          t.snap(marks(q.map((x) => ({ kind: 'frontier' as const, index: x.uid }))), 3, `Queue the children of ${n.key}. Waiting: ${q.map((x) => x.key).join(', ') || 'nobody'}.`);
        }
      } else walk(t.root);
      t.snap(marks(), null, `Done: visited ${k} node${k === 1 ? '' : 's'}.`);
      return t.steps;
    },
  });
}

/** Inorder traversal. */
export const inorder = traversal('in', 'Inorder Traversal', 'Left subtree, then the node, then the right subtree. On a BST this visits keys in sorted order.', ['walk(node)', '  walk(node.left)', '  visit(node)', '  walk(node.right)']);
/** Preorder traversal. */
export const preorder = traversal('pre', 'Preorder Traversal', 'The node first, then its left and right subtrees. Useful for copying a tree.', ['walk(node)', '  visit(node)', '  walk(node.left)', '  walk(node.right)']);
/** Postorder traversal. */
export const postorder = traversal('post', 'Postorder Traversal', 'Both subtrees first, then the node. Useful for deleting a tree.', ['walk(node)', '  walk(node.left)', '  walk(node.right)', '  visit(node)']);
/** Level-order traversal. */
export const levelorder = traversal('level', 'Level-Order Traversal', 'Visits the tree one depth at a time from left to right, using a queue.', ['queue = [root]', 'while the queue is not empty', '  node = dequeue(); visit(node)', '  enqueue its children']);
