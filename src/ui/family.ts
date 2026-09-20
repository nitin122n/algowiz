/** Display metadata for the algorithm families: names, one-line pitch, and the icon used everywhere. */
import { ChartBar, Graph, LinkSimple, MagnifyingGlass, PuzzlePiece, SquaresFour, TextAa, TreeStructure } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import type { Family } from '../core/step';

/** What the UI needs to know about one family. */
export interface FamilyMeta {
  id: Family;
  label: string;
  pitch: string;
  Icon: Icon;
  /** OKLCH hue that tints this family's chrome. */
  hue: number;
  /** Algorithm whose real run powers the landing-page preview tile. */
  previewId: string;
}

/** Families in sidebar order. */
export const FAMILIES: FamilyMeta[] = [
  { id: 'sorting', hue: 262, label: 'Sorting', pitch: 'Sixteen ways to put numbers in order, from bubble sort to tim sort.', Icon: ChartBar, previewId: 'quick-sort' },
  { id: 'searching', hue: 236, label: 'Searching', pitch: 'Find a value by scanning, halving, jumping, or guessing.', Icon: MagnifyingGlass, previewId: 'binary-search' },
  { id: 'linkedlist', hue: 340, label: 'Linked lists', pitch: 'Singly, doubly, and circular lists with every core operation.', Icon: LinkSimple, previewId: 'singly-insert-pos' },
  { id: 'graph', hue: 300, label: 'Graphs and pathfinding', pitch: 'BFS, Dijkstra, A*, spanning trees, mazes, and more on boards and networks.', Icon: Graph, previewId: 'grid-astar' },
  { id: 'tree', hue: 145, label: 'Trees and heaps', pitch: 'BST, AVL, red-black, heaps, tries, union-find, and segment trees.', Icon: TreeStructure, previewId: 'avl-insert' },
  { id: 'dp', hue: 58, label: 'Dynamic programming', pitch: 'Fill a table once and reuse every answer.', Icon: SquaresFour, previewId: 'lcs' },
  { id: 'strings', hue: 15, label: 'String matching', pitch: 'KMP, Rabin-Karp, and Z find a pattern without rescanning.', Icon: TextAa, previewId: 'kmp' },
  { id: 'classics', hue: 190, label: 'Backtracking and classics', pitch: 'N-Queens, Sudoku, Hanoi, primes, stacks, and queues.', Icon: PuzzlePiece, previewId: 'tower-of-hanoi' },
];

/** Looks up a family. @param id - family id */
export const familyMeta = (id: Family): FamilyMeta => FAMILIES.find((f) => f.id === id) as FamilyMeta;
