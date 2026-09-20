# ALGO-WIZ

An interactive algorithm visualizer. Every algorithm is recorded step by step, so you can play, pause, step backward and forward, scrub, and change speed. Each step comes with one plain-English sentence, the pseudocode line that caused it, and running counters.

**117 algorithms** in eight families, running entirely in the browser (no backend):

| Family | What is in it |
|---|---|
| Sorting (16) | Bubble, selection, insertion, merge, quick, heap, shell, counting, radix, bucket, cocktail shaker, comb, gnome, cycle, tim (simplified), bogo |
| Searching (8) | Linear, binary, jump, exponential, interpolation, ternary, Fibonacci, sentinel |
| Linked lists (30) | Singly, doubly, and circular lists, each with traverse, search, insert (head, tail, position), delete (head, tail, position), reverse, find middle |
| Graphs and pathfinding (21) | Grid: BFS, DFS, Dijkstra (with mud), A*, greedy best-first, bidirectional BFS. Mazes: recursive backtracker, Prim, Kruskal. Graphs: BFS, DFS, components, Dijkstra, Bellman-Ford, Floyd-Warshall, Prim, Kruskal, topological sort (two ways), cycle detection, Tarjan SCC |
| Trees and heaps (19) | BST insert/search/delete, AVL insert/delete, red-black insert, four traversals, heap insert/extract/build (min and max), trie insert/search, union-find, segment tree build/query/update |
| Dynamic programming (8) | Fibonacci (memo and table), 0/1 knapsack, coin change, matrix chain, LCS, edit distance, LIS |
| String matching (3) | KMP, Rabin-Karp, Z-algorithm |
| Backtracking and classics (12) | N-Queens, Sudoku, Tower of Hanoi, permutations, subsets, subset sum, sieve of Eratosthenes, GCD, fast exponentiation, stack, queue, deque |

Extras: a **Complexity Lab** in every Theory tab (runs the algorithm on growing inputs, plots the time and peak memory it really used, fits the growth curve, overlays another algorithm, and marks your own run as it plays), a **counter timeline** in the Stats tab (drag to scrub), **bars or array boxes** for sorting and searching with elements that slide when they move, **race mode** (up to four sorts on the same data), optional step sounds (pitch follows the values), draw-your-own walls on pathfinding boards, edit-your-own graphs and boards, a dark "spellbook codex" theme and a light "misty dawn" theme with glass panels and scroll-driven motion (a scroll-scrubbed binary search on the landing page), a search palette (Ctrl/Cmd+K), and shareable URLs that restore your data and the exact step.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest: every algorithm, the registry contract, and the UI
npm run typecheck  # strict TypeScript
npm run build      # static site in dist/
```

## Shortcuts

| Key | Action |
|---|---|
| Space | Play or pause |
| Left / Right | Step back or forward |
| Home / End | Jump to start or end |
| `[` and `]` | Halve or double the speed |
| T | Switch light and dark theme |
| `/` or Ctrl/Cmd+K | Search algorithms |

## How it works

Each algorithm is a pure function `run(input) -> Step[]`. A `Step` holds a full state snapshot, highlight marks, the active pseudocode line, a one-sentence explanation, and running counters. Because the whole run is recorded first, the player only moves an index, which makes stepping backward and scrubbing free. Eight renderers (bars, linked list, table, grid, graph, tree, text, Hanoi) draw the states.

```
src/core/         Step contract, registry, recorders, forms, player math, routes, sound,
                  scaling recipes, growth fitting, lab engine, element identities
src/algorithms/   One folder per family (sorting, searching, linkedlist, graph, pathfinding, tree, dp, strings, classics)
src/views/        The eight renderers and the color legend
src/seo/          Per-page metadata, structured data, and the static HTML the build writes
scripts/          Post-build step (one HTML file per page, sitemap, robots) and image sources
src/ui/           App shell: sidebar, palette, inputs, player dock, panels, landing page, race
src/styles/       Tokens (OKLCH, per-family hues), base, shell, page, views, landing
tests/            Algorithm correctness against reference implementations, registry contract, UI
```

## Add an algorithm

1. Create a definition in the family folder: `defineSort`, `defineSearch`, `defineGraph`, `definePath`, `defineTree`, or the generic `defineForm` (see `src/algorithms/define.ts`). Record steps with `Tracer`, `SearchTracer`, `Rec`, or `Table`.
2. Add it to that family's `index.ts` array.
3. Add theory text in `src/algorithms/theoryExtra.ts`. For the Complexity Lab, give it a `scale` recipe (array, search, and list algorithms get one automatically) and record extra memory with `alloc`/`free` and recursion with `enter`/`leave`.
4. Run `npm test`. The registry contract test checks that every step has an explanation, a valid pseudocode line, and non-decreasing counters, and that random inputs run without errors.

## Deploy

It is a static site (no server). `npm run build` type-checks, builds the app, then runs `scripts/build-seo.ts`, which writes one HTML file per page (home, `/algorithms`, `/race`, and `/algorithms/<id>` for all 117 algorithms), plus `sitemap.xml`, `robots.txt`, and a real `404.html`.

On Vercel, `vercel.json` supplies everything (clean URLs, cache headers). The public origin used in canonical URLs and the sitemap comes from `SITE_URL`, else Vercel's production domain, else `https://algowiz-five.vercel.app`. Any static host that serves `dist/` with clean URLs and a custom 404 works.

## Search engines

Every page has its own real URL, title, description, canonical link, Open Graph and Twitter tags, JSON-LD (LearningResource and BreadcrumbList for algorithms, WebSite and WebApplication for the home page), and readable HTML content that exists before any JavaScript runs. Playback state (data, step) lives in the query string and is not indexed; the canonical link always points at the clean path. Old `#/a/<id>` links redirect to the new paths.

To get indexed: add the site to [Google Search Console](https://search.google.com/search-console), submit `/sitemap.xml`, and use "Request indexing" on the home page.

## Credits

Built by Mayank Karki, Nitin Kandpal, and Swarit Kumar. MIT license (see `LICENSE`).
