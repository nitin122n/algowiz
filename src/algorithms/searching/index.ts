/** All searching algorithms, in sidebar order. */
import { linearSearch } from './linear';
import { binarySearch } from './binary';
import { jumpSearch } from './jump';
import { exponentialSearch } from './exponential';
import { interpolationSearch } from './interpolation';
import { ternarySearch } from './ternary';
import { fibonacciSearch } from './fibonacci';
import { sentinelSearch } from './sentinel';

/** Searching definitions. */
export const SEARCHING = [
  linearSearch, binarySearch, jumpSearch, exponentialSearch, interpolationSearch, ternarySearch, fibonacciSearch, sentinelSearch,
];
