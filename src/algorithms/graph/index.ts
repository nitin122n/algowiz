/** Graph algorithms (grid pathfinding lives in ../pathfinding). */
import { connectedComponents, graphBfs, graphDfs } from './traversal';
import { bellmanFord, dijkstraGraph, floydWarshall } from './shortest';
import { kruskal, prim } from './mst';
import { cycleDetection, tarjanScc, topoDfs, topoKahn } from './directed';

/** Graph definitions in sidebar order. */
export const GRAPHS = [graphBfs, graphDfs, connectedComponents, dijkstraGraph, bellmanFord, floydWarshall, prim, kruskal, topoKahn, topoDfs, cycleDetection, tarjanScc];
