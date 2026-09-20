/**
 * Post-build step: turns the single built `dist/index.html` into one static HTML file per page,
 * each with its own title, description, canonical URL, structured data, and readable content,
 * then writes sitemap.xml, robots.txt, and a real 404 page.
 *
 * Run by `npm run build` (via vite-node). Set SITE_URL to override the public origin.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { renderPage, robotsTxt, sitemapXml } from '../src/seo/html';
import { sitemapEntries } from '../src/seo/meta';
import { siteUrl } from '../src/seo/site';

const DIST = join(process.cwd(), 'dist');
const origin = siteUrl(process.env);
const template = readFileSync(join(DIST, 'index.html'), 'utf8');
if (!template.includes('<!--seo-head-->')) throw new Error('dist/index.html has no <!--seo-head--> marker; was index.html changed?');

/** Writes a file, creating its folder first. */
function write(rel: string, body: string): void {
  const file = join(DIST, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
}

const entries = sitemapEntries();
for (const e of entries) write(e.path === '/' ? 'index.html' : join(e.path, 'index.html'), renderPage(template, e.path, origin));
write('404.html', renderPage(template, '/404', origin));
write('sitemap.xml', sitemapXml(origin, entries, new Date().toISOString().slice(0, 10)));
write('robots.txt', robotsTxt(origin));

console.log(`SEO: wrote ${entries.length} pages, 404.html, sitemap.xml, and robots.txt for ${origin}`);
