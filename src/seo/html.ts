/** Static HTML for crawlers: head tags and readable page content, built from the same data the app uses. */
import { REGISTRY } from '../algorithms';
import { hrefFor, INDEX_PATH } from '../core/routes';
import { FAMILIES, familyMeta } from '../ui/family';
import { algorithmMeta, displayName, homeMeta, indexMeta, missingMeta, raceMeta, type PageMeta } from './meta';
import { OG_IMAGE, SITE_NAME } from './site';

/** Escapes text for HTML content and attributes. */
export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Makes origin-relative URLs inside JSON-LD absolute. */
function absolutize(value: unknown, origin: string): unknown {
  if (typeof value === 'string') return value.startsWith('/') ? origin + value : value;
  if (Array.isArray(value)) return value.map((v) => absolutize(v, origin));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, absolutize(v, origin)]));
  return value;
}

/**
 * Builds the `<head>` tags for a page: title, description, canonical, robots, Open Graph, Twitter, JSON-LD.
 * @param meta - page metadata
 * @param origin - public origin such as `https://algowiz-five.vercel.app`
 */
export function headTags(meta: PageMeta, origin: string): string {
  const url = origin + meta.path;
  const img = origin + OG_IMAGE;
  const lines = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
  ];
  for (const ld of meta.jsonLd) lines.push(`<script type="application/ld+json">${JSON.stringify(absolutize(ld, origin)).replace(/</g, '\\u003c')}</script>`);
  return lines.join('\n    ');
}

/** Link list used by the static pages. */
function links(items: Array<{ href: string; label: string }>): string {
  return `<ul>${items.map((i) => `<li><a href="${esc(i.href)}">${esc(i.label)}</a></li>`).join('')}</ul>`;
}

/**
 * Readable page content placed inside `<div id="root">`. Crawlers and no-JavaScript visitors read it;
 * the app replaces it as soon as it loads.
 * @param path - page path
 */
export function bodyContent(path: string): string {
  const shell = (inner: string) => `<main class="seo">${inner}<nav aria-label="Site"><a href="/">Home</a> · <a href="${INDEX_PATH}">All algorithms</a> · <a href="/race">Sorting race</a></nav><noscript><p>${SITE_NAME} runs in your browser and needs JavaScript for the interactive visualizations.</p></noscript></main>`;

  if (path === '/') {
    return shell(
      `<h1>${SITE_NAME}: watch algorithms think</h1><p>${esc(homeMeta().description)}</p>` +
        FAMILIES.map((f) => `<section><h2>${esc(f.label)}</h2><p>${esc(f.pitch)}</p>${links(REGISTRY.byFamily(f.id).slice(0, 6).map((d) => ({ href: hrefFor({ id: d.id }), label: displayName(d) })))}</section>`).join('') +
        `<p><a href="${INDEX_PATH}">See all ${REGISTRY.all.length} algorithms</a></p>`,
    );
  }
  if (path === INDEX_PATH) {
    return shell(
      `<h1>All ${REGISTRY.all.length} algorithm visualizations</h1><p>${esc(indexMeta().description)}</p>` +
        FAMILIES.map((f) => `<section id="${f.id}"><h2>${esc(f.label)}</h2><p>${esc(f.pitch)}</p>${links(REGISTRY.byFamily(f.id).map((d) => ({ href: hrefFor({ id: d.id }), label: displayName(d) })))}</section>`).join(''),
    );
  }
  if (path === '/race') return shell(`<h1>Sorting algorithm race</h1><p>${esc(raceMeta().description)}</p>`);

  const def = REGISTRY.all.find((d) => hrefFor({ id: d.id }) === path);
  if (!def) return shell(`<h1>Page not found</h1><p>There is no page at this address. <a href="${INDEX_PATH}">Browse all algorithms</a>.</p>`);
  const c = def.complexity;
  const fam = familyMeta(def.family);
  const related = REGISTRY.byFamily(def.family).filter((d) => d.id !== def.id && (d.group ?? '') === (def.group ?? '')).slice(0, 8);
  const { invariant, proof, notes } = def.theory;
  return shell(
    `<h1>${esc(displayName(def))} visualization</h1><p>${esc(def.summary)}</p>` +
      `<h2>Time and space complexity</h2><ul><li>Best case: ${esc(c.best)}</li><li>Average case: ${esc(c.average)}</li><li>Worst case: ${esc(c.worst)}</li><li>Space: ${esc(c.space)}</li></ul>` +
      `<h2>Pseudocode</h2><pre>${esc(def.pseudocode.join('\n'))}</pre>` +
      (invariant ? `<h2>Key property</h2><p>${esc(invariant)}</p>` : '') +
      (proof?.length ? `<h2>Why it works</h2><ol>${proof.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>` : '') +
      (notes?.length ? `<h2>Notes</h2><ul>${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '') +
      (related.length ? `<h2>More ${esc(def.group ?? fam.label)}</h2>${links(related.map((d) => ({ href: hrefFor({ id: d.id }), label: displayName(d) })))}` : '') +
      `<p><a href="${INDEX_PATH}#${def.family}">All ${esc(fam.label)} algorithms</a></p>`,
  );
}

/** Metadata for a path, or the missing-page metadata. */
export function metaForPath(path: string): PageMeta {
  if (path === '/') return homeMeta();
  if (path === INDEX_PATH) return indexMeta();
  if (path === '/race') return raceMeta();
  const def = REGISTRY.all.find((d) => hrefFor({ id: d.id }) === path);
  return def ? algorithmMeta(def) : missingMeta();
}

/**
 * Produces the full HTML file for one path from the built `index.html` template.
 * Replaces the placeholder head block and fills the root with static content.
 * @param template - built index.html containing the `<!--seo-head-->` marker and an empty root
 * @param path - page path
 * @param origin - public origin
 */
export function renderPage(template: string, path: string, origin: string): string {
  return template.replace('<!--seo-head-->', headTags(metaForPath(path), origin)).replace('<div id="root"></div>', `<div id="root">${bodyContent(path)}</div>`);
}

/**
 * Builds sitemap.xml.
 * @param origin - public origin
 * @param entries - paths from `sitemapEntries()`
 * @param lastmod - ISO date to stamp on every entry
 */
export function sitemapXml(origin: string, entries: Array<{ path: string; priority: number; changefreq: string }>, lastmod: string): string {
  const urls = entries.map((e) => `  <url><loc>${esc(origin + e.path)}</loc><lastmod>${lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Builds robots.txt: everything crawlable, with a pointer to the sitemap.
 * @param origin - public origin
 */
export function robotsTxt(origin: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
}
