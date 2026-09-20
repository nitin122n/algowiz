/** Measures an element's width and keeps it current as the layout changes. */
import { useEffect, useRef, useState } from 'react';

/**
 * @param fallback - width to assume before measuring (and in environments without ResizeObserver)
 * @returns a ref to attach and the element's current width in pixels
 */
export function useWidth<T extends HTMLElement>(fallback = 640): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width || fallback));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return [ref as React.RefObject<T>, width];
}
