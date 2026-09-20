/**
 * Theory text for algorithms added after the original Flask version: one key property (the invariant)
 * plus a few notes on when to use the algorithm and what to watch for.
 */
import type { Theory } from '../core/step';

/**
 * Builds a theory entry.
 * @param invariant - the property that stays true throughout the run
 * @param notes - short facts: stability, trade-offs, typical uses
 */
const t = (invariant: string, ...notes: string[]): Theory => ({ invariant, notes });

/** Extra theory entries keyed by algorithm id. */
export const THEORY_EXTRA: Record<string, Theory> = {
  // Sorting
  'shell-sort': t('After sorting with gap g, every g-th element sequence is sorted; the last pass (gap 1) is a nearly-sorted insertion sort.', 'Not stable.', 'In place, and much faster than insertion sort on medium arrays.'),
  'counting-sort': t('After tallying, count[v] is exactly how many times v occurs, so writing v count[v] times in increasing order yields the sorted array.', 'Not comparison-based, so it beats the O(n log n) comparison bound.', 'Best when the range of values is small compared with n.'),
  'radix-sort': t('After processing the k lowest digits, the array is sorted by those k digits (stably).', 'Stability of each digit pass is what makes the whole sort correct.', 'Good for fixed-width integers and strings.'),
  'bucket-sort': t('Every value in bucket i is no larger than any value in bucket i + 1, so sorting each bucket and concatenating sorts the array.', 'Fast when values are spread evenly; degrades to O(n²) when they all land in one bucket.'),
  'cocktail-sort': t('After each forward pass the largest unsorted value is at the right end; after each backward pass the smallest is at the left end.', 'Stable and in place.', 'Helps when small values sit near the end of the array (bubble sort’s "turtles").'),
  'comb-sort': t('When the gap reaches 1 the array is nearly sorted, so the final bubble-sort pass needs few swaps.', 'Not stable.', 'The shrink factor 1.3 is an empirical sweet spot.'),
  'gnome-sort': t('Everything to the left of pos is sorted.', 'Stable and in place.', 'Simple but O(n²); mostly a teaching algorithm.'),
  'cycle-sort': t('Each value is written directly to its final position, so no value is written more than once.', 'Not stable.', 'Makes the minimum possible number of writes, useful when writes are expensive (flash memory).'),
  'tim-sort': t('Every run is sorted before merging, and merging two sorted runs yields a sorted run.', 'Stable. Real Tim sort (Python, Java) uses runs of 32 to 64 and detects natural runs; this version uses runs of 4 so it is easy to watch.', 'Worst case O(n log n), best case O(n) on already-sorted data.'),
  'bogo-sort': t('None: each shuffle is independent of the last.', 'Expected number of shuffles is n!, so 5 elements need about 120 on average.', 'A joke algorithm that shows why complexity classes matter.'),
  // Searching
  'interpolation-search': t('The target, if present, is always between a[lo] and a[hi].', 'Assumes values are roughly evenly spread; on skewed data it degrades to O(n).', 'Like looking up a name in a phone book by guessing the page.'),
  'ternary-search': t('The target, if present, is always inside the current window [lo, hi].', 'Uses more comparisons than binary search (about 2 log₃ n vs log₂ n), so it is rarely better for searching sorted arrays.', 'Its real strength is finding the maximum of a unimodal function.'),
  'fibonacci-search': t('The target, if present, is always inside the window of size fib(m) that ends at the current offset.', 'Uses only addition and subtraction, which mattered on old hardware without fast division.', 'Accesses memory in a more clustered pattern than binary search.'),
  'sentinel-search': t('a[i] != target for every index before the current one.', 'Removes the "i < n" bounds check from the loop, saving one comparison per element.', 'The last element is restored afterwards, and checked separately.'),
  // Graph traversal
  'graph-bfs': t('Nodes are dequeued in order of nondecreasing distance from the start.', 'Finds shortest paths in unweighted graphs.', 'Uses a queue, so memory grows with the widest level of the graph.'),
  'graph-dfs': t('The nodes on the current recursion path always form a path from the start to the current node.', 'Uses a stack (or recursion), so memory grows with the depth.', 'Basis for cycle detection, topological sort, and strongly connected components.'),
  'connected-components': t('Every node labeled so far belongs to a component that has been completely explored.', 'Runs in O(V + E) no matter how many components there are.', 'Union-find is an alternative when edges arrive one at a time.'),
  // Shortest paths and spanning trees
  'dijkstra-graph': t('When a node is finalized, its distance is the true shortest distance.', 'Requires non-negative edge weights.', 'With a binary heap it runs in O((V + E) log V); this array-based version is O(V²).'),
  'bellman-ford': t('After k rounds, dist[v] is at most the length of the shortest path using k edges or fewer.', 'Handles negative weights and detects negative cycles.', 'Slower than Dijkstra: O(V·E).'),
  'floyd-warshall': t('After processing intermediate nodes 0..k, dist[i][j] is the shortest path using only those nodes as stops.', 'Finds all pairs at once in O(V³).', 'Works with negative edges, but not negative cycles.'),
  prim: t('The edges chosen so far are part of some minimum spanning tree (the cut property).', 'Grows a single tree, so it suits dense graphs.', 'Only works on the start node’s component if the graph is disconnected.'),
  kruskal: t('The chosen edges never contain a cycle and are part of some minimum spanning tree.', 'Sorts edges once, then uses union-find to test for cycles.', 'Naturally produces a spanning forest on disconnected graphs.'),
  'topological-sort-kahn': t('Every node already output has had all its prerequisites output before it.', 'Only exists for directed acyclic graphs (DAGs).', 'If nodes remain when the queue empties, the graph has a cycle.'),
  'topological-sort-dfs': t('A node finishes only after everything reachable from it has finished.', 'Reversing the finish order gives a valid topological order.', 'Meeting a node that is still in progress proves a cycle.'),
  'cycle-detection': t('Gray nodes are exactly the nodes on the current DFS path.', 'A cycle exists exactly when DFS meets a gray node.', 'Used by build systems and package managers to reject circular dependencies.'),
  'tarjan-scc': t('A node stays on the stack until its whole strongly connected component has been found.', 'One DFS, O(V + E).', 'Condensing each component to a single node gives a DAG.'),
  // Grid pathfinding and mazes
  'grid-bfs': t('Cells are explored in order of their distance from the start.', 'Guarantees the shortest path in moves when every step costs the same.', 'Explores in all directions, so it may visit many cells.'),
  'grid-dfs': t('The stack always holds cells discovered but not yet explored.', 'Does not guarantee the shortest path.', 'Uses little memory on long corridors.'),
  'grid-dijkstra': t('When a cell is expanded, its cost is the cheapest possible.', 'Handles different terrain costs (mud) correctly.', 'Explores in a widening circle, like BFS but by cost.'),
  'grid-astar': t('If the estimate never overestimates the true remaining cost (it is admissible), the first path found to the goal is cheapest.', 'Manhattan distance is admissible on a grid with 4-way moves.', 'Usually explores far fewer cells than Dijkstra.'),
  'grid-greedy': t('The next cell is always the one that looks closest to the goal.', 'Fast, but the path found can be much longer than the shortest.', 'Can get stuck exploring dead ends near the goal.'),
  'grid-bidirectional': t('The two searches have explored disjoint sets of cells until the moment they touch.', 'Explores about two circles of radius d/2 instead of one of radius d.', 'Needs the goal to be known and the moves to be reversible.'),
  'maze-backtracker': t('Every visited cell is connected to the start by exactly one path.', 'Produces long corridors with few branches.', 'Uses a stack as deep as the longest corridor.'),
  'maze-prim': t('The maze so far is one connected tree, and only frontier cells are added.', 'Produces many short dead ends and a bushy look.', 'Every result is a perfect maze: exactly one path between any two cells.'),
  'maze-kruskal': t('Two cells end up in the same set exactly when a path already joins them.', 'Removing a wall between different sets never creates a loop.', 'Produces a uniform-looking texture of short passages.'),
  // Trees
  'bst-insert': t('For every node, all keys in its left subtree are smaller and all keys in its right subtree are larger.', 'Inserting sorted data builds a chain, making operations O(n).', 'Balanced variants (AVL, red-black) avoid that.'),
  'bst-search': t('If the key is present, it lies in the subtree the search is currently in.', 'Each step discards a whole subtree.', 'O(h) where h is the height of the tree.'),
  'bst-delete': t('After deletion the BST ordering rule still holds for every node.', 'The in-order successor is the smallest key larger than the deleted key.', 'Using the in-order predecessor instead works equally well.'),
  'avl-insert': t('For every node, the heights of its two subtrees differ by at most 1.', 'A single insert needs at most one single or double rotation.', 'Height is always O(log n).'),
  'avl-delete': t('For every node, the heights of its two subtrees differ by at most 1.', 'A delete may need rotations at several levels on the way up.', 'Stricter balance than red-black trees, so lookups are slightly faster.'),
  'red-black-insert': t('The root is black, no red node has a red child, and every root-to-leaf path has the same number of black nodes.', 'Height is at most 2 log₂(n + 1).', 'Used in many standard libraries (C++ std::map, Java TreeMap).'),
  'inorder-traversal': t('All nodes in a subtree are visited together, with the node between its two subtrees.', 'On a BST it visits keys in sorted order.'),
  'preorder-traversal': t('A node is visited before anything in its subtrees.', 'Recreating a tree from its preorder sequence plus its BST property is straightforward.'),
  'postorder-traversal': t('A node is visited after everything in its subtrees.', 'Used to free or evaluate a tree bottom-up (expression trees).'),
  'levelorder-traversal': t('All nodes at depth d are visited before any node at depth d + 1.', 'This is breadth-first search on a tree.'),
  'heap-insert': t('Every parent is better than (or equal to) its children.', 'A heap is a complete binary tree stored in an array: the parent of i is (i - 1) / 2.', 'Insert is O(log n) in the worst case, O(1) on average for random data.'),
  'heap-extract': t('After moving the last element to the root, only the root can violate the heap rule.', 'Sifting down restores the rule in O(log n).', 'Repeated extraction is heap sort.'),
  'heap-build': t('When index i is processed, both of its subtrees are already valid heaps.', 'Building bottom-up is O(n), faster than n inserts (O(n log n)).'),
  'trie-insert': t('Each path from the root spells a prefix of some inserted word.', 'Cost depends on the word length, not on how many words are stored.', 'Words that share a prefix share nodes.'),
  'trie-search': t('The path followed so far spells a prefix of the searched word.', 'Finding a prefix is the same walk without the word-end check, which makes tries ideal for autocomplete.'),
  'union-find': t('Two elements are in the same set exactly when they have the same root.', 'Union by rank keeps trees shallow; path compression flattens them further.', 'Together they make each operation nearly constant: O(α(n)).'),
  'segtree-build': t('Every node stores the sum of its range, and a parent’s range is the union of its children’s ranges.', 'Needs about 2n nodes and O(n) time to build.'),
  'segtree-query': t('The chosen nodes cover the query range exactly, with no overlaps.', 'At most about 2 log n nodes are combined, so a query is O(log n).'),
  'segtree-update': t('After an update, only the ancestors of the changed leaf can hold stale sums.', 'Recomputing those O(log n) ancestors keeps the whole tree correct.'),
  // Dynamic programming
  'fibonacci-memo': t('memo[k], once set, always equals F(k).', 'Top-down: only computes the values actually needed.', 'Plain recursion takes exponential time; caching makes it linear.'),
  'fibonacci-tabulation': t('When cell k is filled, cells 0 to k - 1 already hold the right values.', 'Bottom-up: no recursion, so no stack overflow.', 'Only the last two cells are ever needed, so space can drop to O(1).'),
  'knapsack-01': t('best[i][w] is the highest value achievable using only the first i items and capacity w.', 'Each item is either taken whole or left out.', 'Runs in pseudo-polynomial time O(n·W): fast when W is small.'),
  'coin-change': t('dp[a] is the fewest coins that make amount a (or infinity if impossible).', 'A greedy "largest coin first" strategy can fail (coins 1, 5, 6 and amount 11), but DP never does.'),
  'matrix-chain': t('cost[i][j] is the cheapest way to multiply matrices i through j.', 'Shows how DP finds the best split point by trying all of them.', 'Only the order changes, never the result, but the cost can differ enormously.'),
  lcs: t('table[i][j] is the LCS length of the first i letters of A and the first j letters of B.', 'Used by diff tools to compare files.', 'A subsequence keeps order but may skip letters, unlike a substring.'),
  'edit-distance': t('table[i][j] is the edit distance between the first i letters of A and the first j letters of B.', 'Used in spell checkers and DNA alignment.', 'Also called Levenshtein distance.'),
  lis: t('dp[i] is the length of the longest increasing subsequence that ends exactly at position i.', 'This O(n²) version is easy to follow; an O(n log n) version uses binary search on tail values.'),
  // Strings
  kmp: t('The text pointer i never moves backward, and pattern[0..j) always equals text[i - j..i).', 'The failure table records the longest proper prefix of each prefix that is also its suffix.', 'Guaranteed O(n + m), even on adversarial input.'),
  'rabin-karp': t('The rolling hash of a window equals the hash of its letters, updated in O(1) per shift.', 'Different strings can share a hash (a collision), so equal hashes must be confirmed letter by letter.', 'Excels at searching for many patterns at once.'),
  'z-algorithm': t('Every position inside the window [l, r) is known to match the prefix, so its Z value can start from the mirrored position.', 'The separator "$" guarantees a match cannot run past the pattern.', 'Total work is O(n + m) because the window only moves right.'),
  // Classics
  'n-queens': t('The queens placed so far never attack each other.', 'Backtracking abandons a partial solution as soon as it cannot be completed.', 'Solutions exist for every board of size 4 or more.'),
  sudoku: t('Every digit placed so far obeys the row, column, and box rules.', 'Real solvers add constraint propagation to backtrack far less.', 'This animation caps at a fixed number of steps for very hard puzzles.'),
  'tower-of-hanoi': t('The disk being moved is smaller than the disk it lands on.', 'Moving n disks takes exactly 2ⁿ - 1 moves, and no method can do better.'),
  permutations: t('The items before slot k are fixed; the items from slot k on are still to be arranged.', 'There are n! permutations, so the count explodes quickly.'),
  subsets: t('The items before index i have each been decided: in or out.', 'A set of n items has 2ⁿ subsets, one per path through the decisions.'),
  'subset-sum': t('The running sum equals the sum of the items chosen so far.', 'Pruning branches that already overshoot avoids much of the 2ⁿ search.', 'NP-complete in general; DP solves it in pseudo-polynomial time.'),
  'sieve-of-eratosthenes': t('Every number crossed out has a smaller prime factor.', 'Starting each prime at p² is enough: smaller multiples were already crossed out.', 'Runs in O(n log log n).'),
  'gcd-euclid': t('gcd(a, b) = gcd(b, a mod b) at every step.', 'The remainder at least halves every two steps, so it takes O(log n) divisions.', 'One of the oldest known algorithms.'),
  'fast-exponentiation': t('result · base^exp always equals the original base^exp.', 'Needs about log₂(exp) squarings instead of exp multiplications.', 'The same trick with a modulus powers RSA encryption.'),
  stack: t('The most recently pushed item that is still present is on top.', 'Push and pop are O(1).', 'Used for undo, function calls, and expression parsing.'),
  queue: t('The item that has waited longest is at the front.', 'Enqueue and dequeue are O(1) with a circular buffer or linked list.', 'Used for scheduling and breadth-first search.'),
  deque: t('Items are ordered from front to back, and both ends are accessible in O(1).', 'Generalizes both the stack and the queue.', 'Used in sliding-window algorithms.'),
};
