import { Tracer } from '../../core/tracer';
import { defineSort } from './define';

/** Gnome sort: a single pointer steps forward when in order and swaps back when not. */
export const gnomeSort = defineSort({
  id: 'gnome-sort',
  name: 'Gnome Sort',
  summary: 'Walks forward while things are in order; on a swap, steps back to re-check the previous pair.',
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: [
    'pos = 0',
    'while pos < n',
    '  if pos == 0 or a[pos-1] <= a[pos]: pos++',
    '  else: swap a[pos], a[pos-1]; pos--',
  ],
  /** Records the run. */
  run(input) {
    const t = new Tracer(input);
    let pos = 0;
    while (pos < t.a.length) {
      if (pos === 0 || !t.compare(pos - 1, pos, 2, [{ kind: 'pointer', index: pos, label: 'pos' }])) {
        pos++;
      } else {
        t.swap(pos, pos - 1, 3, [{ kind: 'pointer', index: pos - 1, label: 'pos' }]);
        pos--;
      }
    }
    return t.finish(1);
  },
});
