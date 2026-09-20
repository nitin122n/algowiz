/** Grid pathfinding and maze generation. */
import { gridAStar, gridBfs, gridBidirectional, gridDfs, gridDijkstra, gridGreedy } from './search';
import { mazeBacktracker, mazeKruskal, mazePrim } from './maze';

/** Pathfinding and maze definitions in sidebar order. */
export const PATHFINDING = [gridBfs, gridDfs, gridDijkstra, gridAStar, gridGreedy, gridBidirectional, mazeBacktracker, mazePrim, mazeKruskal];
