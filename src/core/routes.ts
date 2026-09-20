/**
 * Real URLs. Every page has its own path so search engines can crawl and index it:
 * `/` home, `/algorithms` the index, `/algorithms/<id>` one algorithm, `/race` the sorting race.
 * Playback state (data, target, step) rides in the query string, so a shared link restores it.
 * Links from the old hash form (`#/a/<id>`) are redirected once on load.
 */

/** Which page a URL points at. */
export type Page = 'home' | 'index' | 'race' | 'algorithm' | 'missing';

/** A parsed location, including any shareable state. */
export interface Route {
  page: Page;
  /** Algorithm id when `page` is "algorithm". */
  id: string | null;
  /** Custom input text. */
  q?: string;
  /** Search target. */
  t?: number;
  /** Step index. */
  s?: number;
  /** Linked-list value field. */
  v?: number;
  /** Linked-list index field. */
  i?: number;
  /** Generic form fields that differ from their defaults. */
  f?: Record<string, string>;
}

/** Path of the algorithm index page. */
export const INDEX_PATH = '/algorithms';

/**
 * Builds the href for a route.
 * @param route - page plus any state worth sharing
 * @returns an absolute path such as `/algorithms/bubble-sort?q=5,3,8&s=4`
 */
export function hrefFor(route: Partial<Route> & { id?: string | null }): string {
  const page = route.page ?? (route.id ? 'algorithm' : 'home');
  if (page === 'home') return '/';
  if (page === 'index') return INDEX_PATH;
  if (page === 'race') return '/race';
  const params = new URLSearchParams();
  if (route.q) params.set('q', route.q);
  if (route.t !== undefined) params.set('t', String(route.t));
  if (route.v !== undefined) params.set('v', String(route.v));
  if (route.i !== undefined) params.set('i', String(route.i));
  if (route.f && Object.keys(route.f).length) params.set('f', JSON.stringify(route.f));
  if (route.s) params.set('s', String(route.s));
  const qs = params.toString();
  return `${INDEX_PATH}/${encodeURIComponent(route.id ?? '')}${qs ? `?${qs}` : ''}`;
}

/**
 * Reads the shareable state out of a query string.
 * @param search - `location.search`
 */
function readParams(search: string): Omit<Route, 'page' | 'id'> {
  const params = new URLSearchParams(search);
  const out: Omit<Route, 'page' | 'id'> = {};
  const q = params.get('q');
  if (q) out.q = q;
  const s = params.get('s');
  if (s !== null && Number.isInteger(Number(s)) && Number(s) >= 0) out.s = Number(s);
  for (const key of ['t', 'v', 'i'] as const) {
    const raw = params.get(key);
    if (raw !== null && raw !== '' && Number.isInteger(Number(raw))) out[key] = Number(raw);
  }
  const f = params.get('f');
  if (f) {
    try {
      const parsed = JSON.parse(f) as unknown;
      if (parsed && typeof parsed === 'object') out.f = Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]));
    } catch {
      /* a damaged link falls back to defaults */
    }
  }
  return out;
}

/**
 * Parses a location into a route. Unknown paths become "missing" so the app can say so.
 * @param pathname - `location.pathname`
 * @param search - `location.search`
 */
export function parseUrl(pathname: string, search = ''): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { page: 'home', id: null };
  if (path === '/race') return { page: 'race', id: null };
  if (path === INDEX_PATH) return { page: 'index', id: null };
  const m = new RegExp(`^${INDEX_PATH}/([^/]+)$`).exec(path);
  if (m) return { page: 'algorithm', id: decodeURIComponent(m[1]), ...readParams(search) };
  return { page: 'missing', id: null };
}

/**
 * Translates a legacy hash link (`#/a/<id>`, `#/race`) into a path, so old shared links keep working.
 * @param hash - `location.hash`
 * @returns the path to replace the URL with, or null when the hash is not a legacy link
 */
export function legacyHashPath(hash: string): string | null {
  if (hash.startsWith('#/race')) return '/race';
  const m = /^#\/a\/([^?]+)(\?.*)?$/.exec(hash);
  if (m) return `${INDEX_PATH}/${m[1]}${m[2] ?? ''}`;
  if (hash === '#/' || hash === '#') return '/';
  return null;
}

/**
 * Navigates without reloading the page, then tells the app to re-read the URL.
 * @param href - path to go to
 */
export function navigate(href: string): void {
  if (href === location.pathname + location.search) return;
  history.pushState(null, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Handles a click on an internal link: navigates in place, but leaves new-tab and modified clicks alone.
 * @param e - the click event
 * @param href - the link target
 */
export function onLinkClick(e: React.MouseEvent, href: string): void {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  navigate(href);
}
