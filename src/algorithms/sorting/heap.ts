import { Tracer } from '../../core/tracer';
import { defineSort } from './define';
import { sortedMarks } from './helpers';

/** Heap sort using an in-place max-heap. */
export const heapSort = defineSort({
  id: 'heap-sort',
  name: 'Heap Sort',
  summary: 'Builds a max-heap, then repeatedly moves the largest value to the end and repairs the heap.',
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
  pseudocode: [
    'build a max-heap from the array',
    'for i from n-1 down to 1',
    '  swap a[0], a[i]     // largest goes to the end',
    '  heapify(0, size = i)',
    'heapify: if a child is larger than the node, swap and continue down',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    const n = t.a.length;
    /** Sifts a[i] down within the first `size` elements. */
    const heapify = (size: number, start: number): void => {
      let i = start;
      const tail = sortedMarks(size, n - 1);
      for (;;) {
        let largest = i;
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        if (l < size && t.compare(l, largest, 4, tail)) largest = l;
        if (r < size && t.compare(r, largest, 4, tail)) largest = r;
        if (largest === i) return;
        t.swap(i, largest, 4, tail);
        i = largest;
      }
    };
    t.note([], 0, 'Build a max-heap: sift down every parent, from the last parent to the root.');
    for (let i = (n >> 1) - 1; i >= 0; i--) heapify(n, i);
    for (let i = n - 1; i > 0; i--) {
      t.swap(0, i, 2, sortedMarks(i + 1, n - 1));
      heapify(i, 0);
    }
    return t.finish(1);
  },
});
