/** Reports whether an element is on screen, so decorative animations can pause when they are not. */
import { useEffect, useRef, useState } from 'react';

/**
 * @returns a ref to attach and a boolean that is true while the element intersects the viewport.
 * Defaults to true when IntersectionObserver is unavailable (tests, old browsers).
 */
export function useInView<T extends Element>(): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref as React.RefObject<T>, inView];
}
