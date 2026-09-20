/** Remembers whether arrays are drawn as bars or as a row of boxes. */
import { useCallback, useState } from 'react';

/** How array algorithms are drawn. */
export type ArrayMode = 'bars' | 'cells';

/** Reads the saved choice; storage can throw in private windows. */
function read(): ArrayMode {
  try {
    return localStorage.getItem('algowiz-array-mode') === 'cells' ? 'cells' : 'bars';
  } catch {
    return 'bars';
  }
}

/**
 * The bar/array display choice, persisted per browser.
 * @returns the mode and a setter
 */
export function useArrayMode(): [ArrayMode, (m: ArrayMode) => void] {
  const [mode, setMode] = useState<ArrayMode>(read);
  const set = useCallback((m: ArrayMode) => {
    setMode(m);
    try {
      localStorage.setItem('algowiz-array-mode', m);
    } catch {
      /* the choice still applies for this visit */
    }
  }, []);
  return [mode, set];
}
