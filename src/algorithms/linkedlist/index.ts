/** All linked-list algorithms: three list kinds times ten operations. */
import type { ListKind, ListOp } from '../../core/step';
import { defineListOp } from './list';

/** List kinds in sidebar order. */
const KINDS: ListKind[] = ['singly', 'doubly', 'circular'];
/** Operations in sidebar order. */
const OPS: ListOp[] = ['traverse', 'search', 'insert_head', 'insert_tail', 'insert_pos', 'delete_head', 'delete_tail', 'delete_pos', 'reverse', 'middle'];

/** Linked-list definitions (30). */
export const LINKED_LISTS = KINDS.flatMap((k) => OPS.map((o) => defineListOp(k, o)));
