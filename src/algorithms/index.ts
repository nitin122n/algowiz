/** Central registry of every algorithm in the app. */
import { createRegistry } from '../core/registry';
import { SORTING } from './sorting';
import { SEARCHING } from './searching';
import { LINKED_LISTS } from './linkedlist';
import { GRAPHS } from './graph';
import { PATHFINDING } from './pathfinding';
import { TREES } from './tree';
import { DP } from './dp';
import { STRINGS } from './strings';
import { CLASSICS } from './classics';

/** The app-wide registry. */
export const REGISTRY = createRegistry([...SORTING, ...SEARCHING, ...LINKED_LISTS, ...PATHFINDING, ...GRAPHS, ...TREES, ...DP, ...STRINGS, ...CLASSICS]);
