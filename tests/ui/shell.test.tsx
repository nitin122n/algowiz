import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from '../../src/App';
import { buildInput } from '../../src/ui/inputs';
import { bubbleSort } from '../../src/algorithms/sorting/bubble';
import { binarySearch } from '../../src/algorithms/searching/binary';

/** Moves to a path and lets the app react, like a click on an internal link. */
function go(path: string) {
  act(() => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

beforeEach(() => {
  window.history.pushState(null, '', '/');
  window.scrollTo = () => {};
});

describe('routing', () => {
  it('shows the landing page at #/', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /watch algorithms think/i })).toBeInTheDocument();
  });
  it('opens an algorithm from its path', () => {
    window.history.pushState(null, '', '/algorithms/bubble-sort');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bubble Sort' })).toBeInTheDocument();
  });
  it('shows a not-found page for unknown ids', () => {
    window.history.pushState(null, '', '/algorithms/nope');
    render(<App />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
  it('follows navigation', () => {
    render(<App />);
    go('/algorithms/quick-sort');
    expect(screen.getByRole('heading', { level: 1, name: 'Quick Sort' })).toBeInTheDocument();
  });
});

describe('playback and shortcuts', () => {
  it('steps forward and back with buttons and arrow keys', () => {
    window.history.pushState(null, '', '/algorithms/bubble-sort');
    render(<App />);
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText(/Step 2 of/)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/Step 3 of/)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText(/Step 2 of/)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'End' });
    expect(screen.getByText('Done: the array is sorted.', { selector: '.explain' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Home' });
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
  });
  it('toggles the theme with the T key', () => {
    render(<App />);
    const before = document.documentElement.dataset.theme;
    fireEvent.keyDown(window, { key: 't' });
    expect(document.documentElement.dataset.theme).not.toBe(before);
  });
  it('ignores shortcuts while typing in a field', () => {
    window.history.pushState(null, '', '/algorithms/bubble-sort');
    render(<App />);
    const field = screen.getByLabelText('Numbers');
    fireEvent.keyDown(field, { key: 'ArrowRight' });
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
  });
});

describe('input validation', () => {
  it('shows an inline error for bad input and keeps the last run', () => {
    window.history.pushState(null, '', '/algorithms/bubble-sort');
    render(<App />);
    fireEvent.change(screen.getByLabelText('Numbers'), { target: { value: '3, x, 1' } });
    expect(screen.getByRole('alert')).toHaveTextContent('"x" is not a whole number.');
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
  });
  it('runs the algorithm on valid custom input', () => {
    window.history.pushState(null, '', '/algorithms/bubble-sort');
    render(<App />);
    fireEvent.change(screen.getByLabelText('Numbers'), { target: { value: '3, 1, 2' } });
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.keyDown(window, { key: 'End' });
    expect(screen.getByText(/Step \d+ of/).textContent).toMatch(/of (\d+)/);
  });
});

describe('search palette', () => {
  it('opens with the / key, filters, and navigates on Enter', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '/' });
    const box = screen.getByRole('combobox', { name: 'Search algorithms' });
    fireEvent.change(box, { target: { value: 'heap' } });
    expect(screen.getByRole('option', { name: /Heap Sort/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Bubble Sort/ })).toBeNull();
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(window.location.pathname).toBe('/algorithms/heap-sort');
  });
  it('opens with Ctrl+K and closes with Escape', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const box = screen.getByRole('combobox', { name: 'Search algorithms' });
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('explains an empty result', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '/' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Search algorithms' }), { target: { value: 'zzzz' } });
    expect(screen.getByText(/No algorithm matches/)).toBeInTheDocument();
  });
});

describe('sidebar', () => {
  it('lists algorithms from every family on algorithm pages', () => {
    window.history.pushState(null, '', '/algorithms/bubble-sort');
    render(<App />);
    for (const name of ['Bubble Sort', 'Binary Search', 'Dijkstra\'s Shortest Paths', 'Sudoku Solver', 'KMP']) {
      expect(screen.getAllByRole('link', { name: new RegExp(name.split(' (')[0]) }).length).toBeGreaterThan(0);
    }
  });
});

describe('form-based algorithms', () => {
  it('shows an error for a bad edge list and keeps the last run', () => {
    window.history.pushState(null, '', '/algorithms/graph-bfs');
    render(<App />);
    fireEvent.change(screen.getByLabelText('Edges'), { target: { value: 'A~B' } });
    expect(screen.getByRole('alert')).toHaveTextContent('not an edge');
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
  });
  it('recomputes when the input becomes valid', () => {
    window.history.pushState(null, '', '/algorithms/graph-bfs');
    render(<App />);
    fireEvent.change(screen.getByLabelText('Edges'), { target: { value: 'A-B' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('toggling a board cell edits the wall list', () => {
    window.history.pushState(null, '', '/algorithms/grid-bfs');
    render(<App />);
    const walls = screen.getByLabelText('Walls (cell numbers)') as HTMLInputElement;
    const before = walls.value;
    const cells = document.querySelectorAll('.gcell[data-clickable="true"]');
    fireEvent.click(cells[0]);
    expect((screen.getByLabelText('Walls (cell numbers)') as HTMLInputElement).value).not.toBe(before);
  });
});

describe('race page', () => {
  it('renders all four racers and finishes them', () => {
    window.history.pushState(null, '', '/race');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Sorting race' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'End' });
    expect(screen.getAllByText(/Finished #/).length).toBe(4);
  });
  it('limits the race to four algorithms', () => {
    window.history.pushState(null, '', '/race');
    render(<App />);
    expect(screen.getByRole('button', { name: 'Heap Sort' })).toBeDisabled();
  });
});

describe('buildInput', () => {
  it('rejects oversized input', () => {
    const r = buildInput(bubbleSort.input, { text: Array.from({ length: 61 }, (_, i) => i).join(','), target: '', value: '', index: '' });
    expect(r).toMatchObject({ ok: false });
  });
  it('sorts the array for sorted-only searches and validates the target', () => {
    const ok = buildInput(binarySearch.input, { text: '5, 1, 3', target: '3', value: '', index: '' });
    expect(ok).toMatchObject({ ok: true, input: { array: [1, 3, 5], target: 3 } });
    expect(buildInput(binarySearch.input, { text: '5, 1, 3', target: 'abc', value: '', index: '' })).toMatchObject({ ok: false });
  });
});

describe('complexity lab and timeline', () => {
  it('shows the lab in the Theory tab and switches to space', async () => {
    window.history.pushState(null, '', '/algorithms/merge-sort');
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Theory' }));
    expect(screen.getByRole('heading', { name: 'Complexity Lab' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Space' }));
    expect(screen.getByRole('radio', { name: 'Space' })).toHaveAttribute('aria-checked', 'true');
    // Measurements arrive in time slices; wait for the verdict to name a growth class.
    expect(await screen.findByText(/grows like/, {}, { timeout: 4000 })).toBeInTheDocument();
  });
  it('explains when an algorithm cannot be scaled', () => {
    window.history.pushState(null, '', '/algorithms/sudoku');
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Theory' }));
    expect(screen.getByText(/cannot be measured/)).toBeInTheDocument();
  });
  it('opens and closes the larger view', () => {
    window.history.pushState(null, '', '/algorithms/bubble-sort');
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Theory' }));
    fireEvent.click(screen.getByRole('button', { name: /larger view/ }));
    expect(screen.getByRole('dialog', { name: /Complexity Lab: Bubble Sort/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('draws a counter timeline in the Stats tab', () => {
    window.history.pushState(null, '', '/algorithms/bubble-sort');
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Stats' }));
    expect(screen.getByRole('group', { name: /Counters over the run/ })).toBeInTheDocument();
    expect(screen.getAllByText('peak memory').length).toBeGreaterThan(0);
  });
});

describe('array display mode', () => {
  it('switches between bars and boxes', () => {
    window.history.pushState(null, '', '/algorithms/bubble-sort');
    render(<App />);
    expect(document.querySelector('.bars')).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Array/ }));
    expect(document.querySelector('.arr')).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Bars/ }));
    expect(document.querySelector('.bars')).not.toBeNull();
  });
});
