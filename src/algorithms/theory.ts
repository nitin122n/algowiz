/**
 * Theory text (loop invariants, correctness proofs, notes) ported from the original
 * Flask version of ALGO-WIZ. Keyed by algorithm id. Algorithms without an entry get a
 * generic fallback in the Theory panel.
 */
import type { Theory } from '../core/step';
import { THEORY_EXTRA } from './theoryExtra';

/** Ported theory entries, keyed by algorithm id. */
export const THEORY: Record<string, Theory> = {
  "bubble-sort": {
    "invariant": "After i passes, the last i elements are in their final sorted positions.",
    "proof": [
      "Base case: After first pass, largest element is at the end.",
      "Inductive step: After k passes, k largest elements are at the end.",
      "After n-1 passes, all elements are in sorted order.",
      "Each pass ensures at least one element reaches its final position."
    ],
    "notes": [
      "In-place sorting algorithm",
      "Stable sorting algorithm",
      "Adaptive: becomes faster when array is nearly sorted",
      "Simple implementation but inefficient for large datasets",
      "Best case: Array is already sorted",
      "Worst case: Array is sorted in reverse order",
      "Stability: Stable - maintains relative order of equal elements",
      "Used for: Educational purposes",
      "Used for: Small datasets",
      "Used for: When simplicity is preferred over efficiency",
      "Used for: When memory is extremely limited"
    ]
  },
  "quick-sort": {
    "invariant": "After each partition, all elements ≤ pivot are before it, all elements > pivot are after it.",
    "proof": [
      "Base case: Arrays of size 0 or 1 are sorted.",
      "Partition ensures elements are correctly placed relative to pivot.",
      "Recursive calls sort subarrays independently.",
      "Combining sorted subarrays produces a fully sorted array."
    ],
    "notes": [
      "In-place sorting algorithm",
      "Not stable in typical implementations",
      "Highly efficient for random data",
      "Good cache performance",
      "Best case: Pivot consistently divides array into equal halves",
      "Worst case: Array is sorted or reverse sorted (with basic pivot selection)",
      "Stability: Not stable in standard implementation",
      "Used for: General-purpose sorting",
      "Used for: Large datasets",
      "Used for: Systems with good cache performance",
      "Used for: Standard library implementation in many languages"
    ]
  },
  "merge-sort": {
    "invariant": "Each merged subarray is sorted.",
    "proof": [
      "Base case: Single element is sorted.",
      "Merge combines two sorted arrays while maintaining order.",
      "Each merge step preserves sortedness.",
      "Final merge produces a fully sorted array."
    ],
    "notes": [
      "Divide-and-conquer algorithm",
      "Stable sorting",
      "Predictable performance",
      "Not in-place (requires extra space)",
      "Best case: Any input (consistent performance)",
      "Worst case: Any input (consistent performance)",
      "Stability: Stable - maintains relative order of equal elements",
      "Used for: External sorting",
      "Used for: Linked list sorting",
      "Used for: When stable sorting is required",
      "Used for: Parallel processing applications"
    ]
  },
  "selection-sort": {
    "invariant": "Elements before current position are sorted and ≤ all elements after.",
    "proof": [
      "Base case: First element forms sorted subarray of size 1.",
      "Each iteration selects minimum from unsorted portion.",
      "Selected minimum is placed in correct position.",
      "After n iterations, all elements are sorted."
    ],
    "notes": [
      "In-place sorting algorithm",
      "Simple implementation",
      "Minimal memory usage",
      "Performs well on small arrays",
      "Best case: Any input (consistent performance)",
      "Worst case: Any input (consistent performance)",
      "Stability: Not stable in standard implementation",
      "Used for: Small datasets",
      "Used for: When memory is extremely limited",
      "Used for: When number of writes needs to be minimized",
      "Used for: Educational purposes"
    ]
  },
  "insertion-sort": {
    "invariant": "Elements before current position are always sorted.",
    "proof": [
      "Base case: Single element is sorted.",
      "Each iteration inserts new element into correct position.",
      "Sorted portion maintains order after each insertion.",
      "After n iterations, all elements are in sorted positions."
    ],
    "notes": [
      "In-place sorting algorithm",
      "Stable sorting",
      "Adaptive algorithm",
      "Excellent for small datasets",
      "Best case: Array is already sorted",
      "Worst case: Array is sorted in reverse order",
      "Stability: Stable - maintains relative order of equal elements",
      "Used for: Small datasets",
      "Used for: Nearly sorted arrays",
      "Used for: Online sorting (streaming data)",
      "Used for: When simplicity is preferred"
    ]
  },
  "heap-sort": {
    "invariant": "Max heap property: parent ≥ children.",
    "proof": [
      "Base case: Leaf nodes satisfy heap property.",
      "Heapify maintains heap property for all subtrees.",
      "Extracting max maintains sorted suffix.",
      "After n extractions, array is fully sorted."
    ],
    "notes": [
      "In-place sorting algorithm",
      "Not stable",
      "Based on heap data structure",
      "Guaranteed O(n log n) performance",
      "Best case: Any input (consistent performance)",
      "Worst case: Any input (consistent performance)",
      "Stability: Not stable",
      "Used for: When guaranteed O(n log n) is needed",
      "Used for: Priority queue implementations",
      "Used for: Systems with limited memory",
      "Used for: Real-time systems requiring predictable performance"
    ]
  },
  "binary-search": {
    "invariant": "Target, if present, is always within the current search range [left, right].",
    "proof": [
      "Base case: Single element is either target or not.",
      "Inductive step: Each comparison eliminates half of remaining elements.",
      "Therefore, search space reduces by half each time until target is found or not present."
    ],
    "notes": [
      "Efficiently finds a target value in a sorted array by repeatedly dividing the search space in half."
    ]
  },
  "linear-search": {
    "invariant": "All elements before current index have been checked and are not equal to target.",
    "proof": [
      "Base case: First element is either target or not.",
      "Inductive step: Each element is compared exactly once.",
      "Therefore, if target exists, it will be found; if not, entire array will be searched."
    ],
    "notes": [
      "Sequentially checks each element in the array until a match is found or the end is reached."
    ]
  },
  "jump-search": {
    "invariant": "Target, if present, is always within the current block.",
    "proof": [
      "Jump ahead by √n until block containing target is found.",
      "Linear search within block ensures target is found if present."
    ],
    "notes": [
      "Searches for a target in a sorted array by jumping ahead by fixed steps and then performing linear search in a block."
    ]
  },
  "exponential-search": {
    "invariant": "Target, if present, is always within the current search range.",
    "proof": [
      "Double the bound until target is within range.",
      "Binary search in the found range ensures correctness."
    ],
    "notes": [
      "Finds range where target may exist by repeated doubling, then uses binary search in that range."
    ]
  }
};

/**
 * Looks up ported theory for an algorithm.
 * @param id - algorithm id such as "bubble-sort"
 * @returns the theory entry, or an empty object when none was ported
 */
export function theoryFor(id: string): Theory {
  return THEORY[id] ?? THEORY_EXTRA[id] ?? {};
}
