/** Dynamic programming algorithms. */
import { fibMemo, fibTab } from './fibonacci';
import { coinChange, editDistance, knapsack, lcs, lis, matrixChain } from './tables';

/** DP definitions in sidebar order. */
export const DP = [fibMemo, fibTab, knapsack, coinChange, matrixChain, lcs, editDistance, lis];
