/** App-wide scroll reveal: any element with `data-reveal` settles in the first time it enters the viewport. */
import { useEffect } from 'react';

/**
 * Watches the document for `data-reveal` elements (including ones added later by route changes) and marks
 * each with `data-shown="true"` when it becomes visible. Adds `reveal-on` to <html> so CSS only hides
 * content once this observer is running. Without IntersectionObserver everything is shown at once.
 */
export function useRevealRoot(): void {
  useEffect(() => {
    const html = document.documentElement;
    if (typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return;
    html.classList.add('reveal-on');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.shown = 'true';
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    /** Starts observing every reveal element that has not been shown yet. */
    const scan = () => document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-shown="true"])').forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      html.classList.remove('reveal-on');
    };
  }, []);
}
