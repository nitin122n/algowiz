/** Command palette: type to find any algorithm or page, arrow keys and Enter to go. Opens with Ctrl/Cmd+K or "/". */
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { REGISTRY } from '../algorithms';
import { hrefFor, navigate } from '../core/routes';
import { familyMeta } from './family';
import { displayName } from '../seo/meta';

/** One selectable row. */
interface Item {
  label: string;
  meta: string;
  href: string;
  hue: number;
}

/** Props for {@link CommandPalette}. */
interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal search over every algorithm. Focus moves to the input when it opens and returns on close.
 * @param props - open state and close callback
 */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const all = useMemo<Item[]>(
    () => [
      { label: 'Home', meta: 'Page', href: '/', hue: 262 },
      { label: 'All algorithms', meta: 'Page: the full index', href: '/algorithms', hue: 262 },
      { label: 'Race sorting algorithms', meta: 'Page: compare up to four sorts side by side', href: '/race', hue: 25 },
      ...REGISTRY.all.map((d) => ({ label: displayName(d), meta: `${familyMeta(d.family).label}${d.group ? `, ${d.group}` : ''}`, href: hrefFor({ id: d.id }), hue: familyMeta(d.family).hue })),
    ],
    [],
  );
  const shown = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    return all.filter((it) => tokens.every((t) => `${it.label} ${it.meta}`.toLowerCase().includes(t))).slice(0, 60);
  }, [all, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // Wait a tick so the input exists before focusing it.
      window.setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  /** Goes to an item and closes the palette. */
  const go = (it: Item | undefined) => {
    if (!it) return;
    navigate(it.href);
    onClose();
  };

  return (
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search algorithms">
        <div className="palette-input">
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
          <input
            ref={input}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={shown[active] ? `pal-${active}` : undefined}
            aria-label="Search algorithms"
            placeholder={`Search ${REGISTRY.all.length} algorithms`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(a + 1, shown.length - 1)));
              else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
              else if (e.key === 'Enter') go(shown[active]);
              else if (e.key === 'Escape') onClose();
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="palette-list" id="palette-list" role="listbox" ref={list}>
          {shown.length === 0 && <li className="palette-empty">No algorithm matches "{query}".</li>}
          {shown.map((it, i) => (
            <li key={it.href} id={`pal-${i}`} role="option" aria-selected={i === active} data-active={i === active} style={{ ['--h' as string]: it.hue }} onMouseEnter={() => setActive(i)} onClick={() => go(it)}>
              <span className="pal-dot" aria-hidden="true" />
              <span className="pal-label">{it.label}</span>
              <span className="pal-meta">{it.meta}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
