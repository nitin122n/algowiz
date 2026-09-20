/** App root: path routing, theme, top bar, sidebar, command palette, page selection, and head metadata. */
import { List, MagnifyingGlass, Moon, Sun, Trophy } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { REGISTRY } from './algorithms';
import { legacyHashPath, parseUrl, type Route } from './core/routes';
import { algorithmMeta, homeMeta, indexMeta, missingMeta, raceMeta } from './seo/meta';
import { AlgorithmPage } from './ui/AlgorithmPage';
import { CommandPalette } from './ui/CommandPalette';
import { IndexPage } from './ui/IndexPage';
import { Landing } from './ui/Landing';
import { Link } from './ui/Link';
import { Race } from './ui/Race';
import { Sidebar } from './ui/Sidebar';
import { ignoreShortcut } from './ui/keys';
import { useTheme } from './ui/useTheme';
import { usePageMeta } from './ui/usePageMeta';
import { Backdrop } from './ui/Backdrop';
import { useRevealRoot } from './ui/reveal';

/**
 * Reads the current URL. Old hash links (`#/a/<id>`) are rewritten to real paths once, so shared links keep working.
 */
function currentRoute(): Route {
  const legacy = legacyHashPath(window.location.hash);
  if (legacy) window.history.replaceState(null, '', legacy);
  return parseUrl(window.location.pathname, window.location.search);
}

/**
 * Root component. Global shortcuts: `T` toggles the theme; `/` or Ctrl/Cmd+K opens the search palette.
 */
export function App() {
  const [route, setRoute] = useState<Route>(currentRoute);
  const [theme, toggleTheme] = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  useRevealRoot();

  useEffect(() => {
    /** Re-reads the route on back/forward and after in-app navigation, and returns to the top of the page. */
    const onNav = () => {
      setRoute(currentRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onNav);
    return () => window.removeEventListener('popstate', onNav);
  }, []);

  useEffect(() => {
    /** Global shortcuts: Ctrl/Cmd+K and / open search, T toggles the theme. */
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(true);
        return;
      }
      if (ignoreShortcut(e)) return;
      if (e.key === 't' || e.key === 'T') toggleTheme();
      else if (e.key === '/') {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleTheme]);

  const def = route.page === 'algorithm' && route.id ? REGISTRY.get(route.id) : undefined;
  const meta = useMemo(() => {
    if (route.page === 'home') return homeMeta();
    if (route.page === 'index') return indexMeta();
    if (route.page === 'race') return raceMeta();
    return def ? algorithmMeta(def) : missingMeta();
  }, [route.page, def]);
  usePageMeta(meta);

  // The family hue tints the whole chrome (sidebar, buttons, focus rings).
  useEffect(() => {
    document.documentElement.dataset.family = route.page === 'race' ? 'race' : def?.family ?? 'home';
  }, [route.page, def]);

  return (
    <div className="shell">
      <Backdrop />
      <header className="topbar">
        <button className="icon-btn menu-btn" aria-label="Toggle menu" aria-expanded={navOpen} onClick={() => setNavOpen((o) => !o)}>
          <List size={20} weight="bold" />
        </button>
        <Link className="logo" href="/" aria-label="AlgoWiz home">
          <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" className="logo-mark">
            <circle cx="16" cy="16" r="14.5" className="logo-ring" />
            <circle cx="16" cy="16" r="11.5" className="logo-ring thin" />
            <rect x="9.5" y="16" width="3.4" height="7" rx="1" className="logo-bar" />
            <rect x="14.3" y="9" width="3.4" height="14" rx="1" className="logo-bar hot" />
            <rect x="19.1" y="13" width="3.4" height="10" rx="1" className="logo-bar" />
          </svg>
          <span>Algo<em>Wiz</em></span>
        </Link>
        <nav className="top-links" aria-label="Site">
          <Link href="/algorithms" aria-current={route.page === 'index' ? 'page' : undefined}>Algorithms</Link>
          <Link href="/race" aria-current={route.page === 'race' ? 'page' : undefined}><Trophy size={16} weight="bold" /> Race</Link>
        </nav>
        <span className="grow" />
        <button className="top-search" onClick={() => setPalette(true)} aria-label="Search algorithms">
          <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
          <span>Search</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title="Switch theme (T)">
          {theme === 'dark' ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
        </button>
      </header>
      <div className="body" data-home={route.page === 'home' || route.page === 'index'}>
        {route.page !== 'home' && route.page !== 'index' && <Sidebar activeId={def?.id ?? null} open={navOpen} onNavigate={() => setNavOpen(false)} onSearch={() => setPalette(true)} />}
        <main className="main" onClick={() => navOpen && setNavOpen(false)}>
          {route.page === 'home' && <Landing />}
          {route.page === 'index' && <IndexPage />}
          {route.page === 'race' && <Race />}
          {route.page === 'algorithm' && def && <AlgorithmPage key={def.id} def={def} initial={route} />}
          {(route.page === 'missing' || (route.page === 'algorithm' && !def)) && (
            <div className="not-found">
              <h1>Page not found</h1>
              <p>{route.id ? `There is no algorithm called "${route.id}".` : 'There is no page at this address.'}</p>
              <Link className="btn primary" href="/">Back to home</Link>
            </div>
          )}
        </main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
