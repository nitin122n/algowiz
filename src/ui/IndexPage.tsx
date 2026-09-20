/** The index of every algorithm: a real, crawlable page that also works as a browsable directory. */
import { REGISTRY } from '../algorithms';
import { hrefFor } from '../core/routes';
import { FAMILIES } from './family';
import { Link } from './Link';

/** Lists all algorithms by family and topic, each with its one-line summary. */
export function IndexPage() {
  return (
    <div className="index-page">
      <header className="index-head">
        <h1>
          All {REGISTRY.all.length} <em>algorithm</em> visualizations
        </h1>
        <p>Pick any algorithm to play it step by step, with plain-English explanations, live pseudocode, and a complexity graph.</p>
        <nav className="index-jump" aria-label="Jump to a family">
          {FAMILIES.map((f) => (
            <a key={f.id} href={`#${f.id}`} style={{ ['--h' as string]: f.hue }} className="hued">
              <f.Icon size={16} weight="duotone" /> {f.label}
            </a>
          ))}
        </nav>
      </header>
      {FAMILIES.map((f) => {
        const defs = REGISTRY.byFamily(f.id);
        const groups = new Map<string, typeof defs>();
        for (const d of defs) groups.set(d.group ?? '', [...(groups.get(d.group ?? '') ?? []), d]);
        return (
          <section key={f.id} id={f.id} className="index-family hued" style={{ ['--h' as string]: f.hue }} data-reveal>
            <h2>
              <span className="sigil"><f.Icon size={20} weight="duotone" /></span>
              {f.label}
              <span className="count">{defs.length}</span>
            </h2>
            <p className="index-pitch">{f.pitch}</p>
            {[...groups.entries()].map(([name, list]) => (
              <div key={name} className="index-group">
                {name && <h3>{name}</h3>}
                <ul>
                  {list.map((d) => (
                    <li key={d.id}>
                      <Link href={hrefFor({ id: d.id })}>
                        <b>{d.name}</b>
                        <span>{d.summary}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
