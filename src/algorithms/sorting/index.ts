/** All sorting algorithms, in sidebar order. */
import { bubbleSort } from './bubble';
import { selectionSort } from './selection';
import { insertionSort } from './insertion';
import { mergeSort } from './merge';
import { quickSort } from './quick';
import { heapSort } from './heap';
import { shellSort } from './shell';
import { countingSort } from './counting';
import { radixSort } from './radix';
import { bucketSort } from './bucket';
import { cocktailSort } from './cocktail';
import { combSort } from './comb';
import { gnomeSort } from './gnome';
import { cycleSort } from './cycle';
import { timSort } from './tim';
import { bogoSort } from './bogo';

/** Sorting definitions. */
export const SORTING = [
  bubbleSort, selectionSort, insertionSort, mergeSort, quickSort, heapSort, shellSort, countingSort,
  radixSort, bucketSort, cocktailSort, combSort, gnomeSort, cycleSort, timSort, bogoSort,
];
