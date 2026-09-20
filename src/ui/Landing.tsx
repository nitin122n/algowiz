/** Landing page: hero with a live run on a glass page, a scroll-driven sort, family pages, and the lab teaser. */
import { ArrowRight, Trophy } from '@phosphor-icons/react';
import { REGISTRY } from '../algorithms';
import { hrefFor } from '../core/routes';
import { Link } from './Link';
import { FAMILIES } from './family';
import { LabTeaser } from './lab/LabTeaser';
import { MiniStage } from './MiniStage';
import { ScrollScrub } from './ScrollScrub';

/** Keyboard shortcuts worth knowing. */
const SHORTCUTS: Array<[string, string]> = [
  ['Space', 'Play or pause'],
  ['Left / Right', 'Step back or forward'],
  ['[  ]', 'Slower or faster'],
  ['T', 'Switch theme'],
  ['/', 'Search'],
];

/**
 * The landing page. Every preview is a real run of the same engine the app uses.
 * Sections settle in as they scroll into view (see `ui/reveal.ts`).
 */
export function Landing() {
  const total = REGISTRY.all.length;
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Watch algorithms <em>think.</em>
          </h1>
          <p className="hero-sub">Step through {total} algorithms with plain-English explanations, live pseudocode, and full playback control.</p>
          <div className="hero-cta">
            <a className="btn primary" href="#families" onClick={(e) => { e.preventDefault(); document.getElementById('families')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Explore algorithms <ArrowRight size={18} weight="bold" />
            </a>
            <Link className="btn" href="/race">
              <Trophy size={18} weight="bold" /> Race sorts
            </Link>
          </div>
        </div>
        <div className="hero-page" aria-hidden="true">
          <div className="page-card">
            <header>
              <span className="page-title">Quick Sort</span>
              <span className="mono dim">O(n log n)</span>
            </header>
            <MiniStage id="quick-sort" size={16} speed={3} caption />
          </div>
          <div className="page-card page-card-small">
            <header>
              <span className="page-title">A* Search</span>
            </header>
            <MiniStage id="grid-astar" speed={6} />
          </div>
        </div>
      </section>

      <ScrollScrub />

      <section id="families" className="families">
        <h2 data-reveal>Eight families, one player.</h2>
        <p className="section-lede" data-reveal>Every algorithm, from bubble sort to Tarjan's components, is played, paused, and explained the same way.</p>
        <div className="bento">
          {FAMILIES.map((f, i) => {
            const defs = REGISTRY.byFamily(f.id);
            return (
              <Link key={f.id} className="tile" data-family={f.id} data-reveal style={{ ['--h' as string]: f.hue, ['--i' as string]: i % 3 }} href={hrefFor({ id: defs[0].id })}>
                <div className="tile-view"><MiniStage id={f.previewId} speed={3} /></div>
                <div className="tile-text">
                  <h3>
                    <span className="sigil"><f.Icon size={18} weight="duotone" /></span>
                    {f.label}
                    <span className="count">{defs.length}</span>
                  </h3>
                  <p>{f.pitch}</p>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="section-more" data-reveal>
          <Link href="/algorithms">Browse all {total} algorithms <ArrowRight size={16} weight="bold" /></Link>
        </p>
      </section>

      <LabTeaser />

      <footer className="site-foot" data-reveal>
        <ul className="shortcuts" aria-label="Keyboard shortcuts">
          {SHORTCUTS.map(([k, d]) => (
            <li key={k}>
              <kbd>{k}</kbd>
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <p>Built by Mayank Karki, Nitin Kandpal, and Swarit Kumar. MIT license.</p>
      </footer>
    </div>
  );
}
