/** Keeps the document head in step with the current page after in-app navigation. */
import { useEffect } from 'react';
import type { PageMeta } from '../seo/meta';
import { OG_IMAGE } from '../seo/site';

/**
 * Sets the title, description, canonical, robots, and Open Graph tags for the current page.
 * The first load is already correct (the build writes these tags into each page's HTML); this keeps them
 * right when the user navigates inside the app.
 * @param meta - metadata for the page on screen
 */
export function usePageMeta(meta: PageMeta): void {
  useEffect(() => {
    const origin = window.location.origin;
    document.title = meta.title;
    /** Sets one head tag's content or href, creating the tag when it is missing. */
    const set = (selector: string, make: () => HTMLElement, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLElement>(selector);
      if (!el) {
        el = make();
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    const meta1 = (name: string) => () => Object.assign(document.createElement('meta'), { name });
    const prop = (property: string) => () => {
      const el = document.createElement('meta');
      el.setAttribute('property', property);
      return el;
    };
    set('meta[name="description"]', meta1('description'), 'content', meta.description);
    set('meta[name="robots"]', meta1('robots'), 'content', meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    set('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', origin + meta.path);
    set('meta[property="og:title"]', prop('og:title'), 'content', meta.title);
    set('meta[property="og:description"]', prop('og:description'), 'content', meta.description);
    set('meta[property="og:url"]', prop('og:url'), 'content', origin + meta.path);
    set('meta[property="og:image"]', prop('og:image'), 'content', origin + OG_IMAGE);
    set('meta[name="twitter:title"]', meta1('twitter:title'), 'content', meta.title);
    set('meta[name="twitter:description"]', meta1('twitter:description'), 'content', meta.description);
  }, [meta]);
}
