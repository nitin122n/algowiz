/** Tree, heap, trie, and disjoint-set algorithms. */
import { avlDeleteDef, avlInsertDef } from './avl';
import { bstDeleteDef, bstInsertDef, bstSearchDef } from './bst';
import { heapBuild, heapExtract, heapInsert } from './heap';
import { rbInsertDef } from './redblack';
import { segBuild, segQuery, segUpdate } from './segtree';
import { inorder, levelorder, postorder, preorder } from './traversal';
import { trieInsert, trieSearch } from './trie';
import { unionFind } from './unionfind';

/** Tree definitions in sidebar order. */
export const TREES = [bstInsertDef, bstSearchDef, bstDeleteDef, avlInsertDef, avlDeleteDef, rbInsertDef, inorder, preorder, postorder, levelorder, heapInsert, heapExtract, heapBuild, trieInsert, trieSearch, unionFind, segBuild, segQuery, segUpdate];
