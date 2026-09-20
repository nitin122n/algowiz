/** Left navigation: every algorithm grouped by family, with a button that opens the search palette. */
import { MagnifyingGlass } from '@phosphor-icons/react';
import { REGISTRY } from '../algorithms';
import type { AlgorithmDef } from '../core/step';
import { hrefFor } from '../core/routes';
import { Link } from './Link';
import { FAMILIES } from './family';

/** Props for {@link Sidebar}. */
interface SidebarProps {
  /** Id of the algorithm on screen, or null. */
  activeId: string | null;
  /** Mobile drawer state. */
  open: boolean;
  /** Called when a link is chosen so the drawer can close. */
  onNavigate: () => void;
  /** Opens the command palette. */
  onSearch: () => void;
}

/**
 * Sidebar with collapsible families. Each family shows its icon in its own hue; sub-groups
 * (linked-list types, graph topics) appear as small headings. The family of the open algorithm starts expanded.
 * @param props - active id, drawer state, and callbacks
 */
export function Sidebar({ activeId, open, onNavigate, onSearch }: SidebarProps) {
  const activeFamily = activeId ? REGISTRY.get(activeId)?.family : undefined;
  return (
    <nav className="sidebar" data-open={open} aria-label="Algorithms">
      <button className="search-btn" onClick={onSearch}>
        <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
        <span>Search algorithms</span>
        <kbd>/</kbd>
      </button>
      {FAMILIES.map((f) => {
        const defs = REGISTRY.byFamily(f.id);
        const sub = new Map<string, AlgorithmDef<any, any>[]>();
        for (const d of defs) sub.set(d.group ?? '', [...(sub.get(d.group ?? '') ?? []), d]);
        return (
          <details key={f.id} open={f.id === activeFamily || (!activeFamily && f.id === 'sorting')} style={{ ['--h' as string]: f.hue }}>
            <summary>
              <span className="fam-icon"><f.Icon size={16} weight="duotone" /></span>
              {f.label}
              <span className="count">{defs.length}</span>
            </summary>
            {[...sub.entries()].map(([name, list]) => (
              <div key={name}>
                {name && <p className="subgroup">{name}</p>}
                <ul>
                  {list.map((d) => (
                    <li key={d.id}>
                      <Link href={hrefFor({ id: d.id })} aria-current={d.id === activeId ? 'page' : undefined} onClick={onNavigate}>{d.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </details>
        );
      })}
    </nav>
  );
}
