# Design

The visual system, recorded from the shipped app.

## World
Two moods of one book.
- **Dark: spellbook codex.** Ink-black pages, warm gold hairlines and glyphs, parchment text. A gold sigil ring naming the eight families turns slowly behind everything, under lamplight haze and paper grain.
- **Light: misty dawn.** A mist-blue to sage gradient with two drifting pools of soft light, frosted glass panels, a lake-blue accent. Same layout, same room at sunrise.
The first visit follows the system setting; T switches.

## Color
OKLCH tokens in `src/styles/tokens.css`.
- One accent per theme: gold `oklch(0.83 0.11 85)` in the codex, lake blue `oklch(0.49 0.09 225)` at dawn. It carries buttons, focus, selection, the active tab, and the scrubber.
- The family hue (`--h`) only colors that family's sigil (sidebar, page header, landing tiles).
- Mark colors carry meaning in the data and are tuned per theme: compare (ember/amber), move (crimson/rose), found (emerald/sage), sorted (verdigris/teal), pivot (amethyst/lavender), insert and frontier (azure/sky), visited, path (gold/marigold).
- Tints mix in `oklab` so hues never drift.

## Type
Cormorant Garamond (display: headlines, explanations, node labels, big numbers; italic for emphasis), Geist (interface), Geist Mono (data, code, indexes). Self-hosted through Fontsource. The serif is justified by the grimoire brief.

## Surfaces
Panels are glass: translucent surface, backdrop blur, 1px accent-tinted hairline, soft offset shadow. The stage and hero pages add an inner hairline frame like a page border, and a dotted ruling so bars and boards line up by eye. Data (cells, nodes, charts) sits on solid surfaces so it stays crisp. Under `prefers-reduced-transparency`, glass falls back to solid.
Controls 12px radius, panels 20px, chips and buttons pill.

## Motion
- Hero: headline, copy, and pages settle in like drying ink (blur to sharp), once.
- Scroll: sections reveal as they enter (`data-reveal`, app-wide observer in `ui/reveal.ts`); hero pages drift up on exit (CSS scroll-driven animation); the top bar firms up as the page scrolls (scroll timeline).
- Scroll-scrub: on the landing page, scrolling through a tall section drives a real binary search step by step (9 steps, about 2.6 screens of scroll).
- Data: array elements slide by identity at a speed tied to playback; explanations ink in on each step.
All of it stops under `prefers-reduced-motion`; revealed content is never hidden without JavaScript.

## Charts
Complexity Lab and counter timeline use the accent for the main series and data colors for input shapes (sorted green, random accent, reversed crimson). Fitted curves are dashed and faint; the compare overlay is a dashed foreground line; the user's run is a pulsing accent dot. Every chart has a text alternative.

## Pages and URLs
Real paths, not hashes: `/`, `/algorithms` (a browsable directory of everything), `/race`, `/algorithms/<id>`. Names that repeat across families (linked-list operations, grid and graph BFS) show their group in front so every page has a unique title. Static content inside `#root` is styled as a plain readable page (`.seo`) for crawlers and no-JavaScript visitors, and replaced by the app on load.
