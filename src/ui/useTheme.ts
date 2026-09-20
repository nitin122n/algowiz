/** Light/dark theme state, persisted in localStorage when available. */
import { useCallback, useEffect, useState } from 'react';

/** Theme names. */
export type Theme = 'dark' | 'light';

/** Reads the saved theme, else the system preference; storage can throw in private windows. */
function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('algowiz-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* fall through to the system preference */
  }
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

/**
 * Tracks the theme and mirrors it to `<html data-theme>`.
 * @returns the current theme and a toggle function
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('algowiz-theme', theme);
    } catch {
      /* storage unavailable: the theme still applies for this session */
    }
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return [theme, toggle];
}
