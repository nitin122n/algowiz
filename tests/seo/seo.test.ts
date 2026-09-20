import { REGISTRY } from '../../src/algorithms';
import { hrefFor } from '../../src/core/routes';
import { bodyContent, headTags, metaForPath, renderPage, robotsTxt, sitemapXml } from '../../src/seo/html';
import { algorithmMeta, sitemapEntries } from '../../src/seo/meta';
import { siteUrl } from '../../src/seo/site';

const ORIGIN = 'https://example.test';
const TEMPLATE = '<html><head><!--seo-head--></head><body><div id="root"></div></body></html>';

describe('siteUrl', () => {
  it('prefers an explicit SITE_URL, then Vercel, then the default', () => {
    expect(siteUrl({ SITE_URL: 'https://a.dev/' })).toBe('https://a.dev');
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'my-app.vercel.app' })).toBe('https://my-app.vercel.app');
    expect(siteUrl({})).toBe('https://algowiz-five.vercel.app');
  });
});

describe('page metadata', () => {
  it('gives every algorithm a unique title, a unique description, and a sane length', () => {
    const titles = new Set<string>();
    const descs = new Set<string>();
    for (const d of REGISTRY.all) {
      const m = algorithmMeta(d);
      expect(m.title.includes(d.name), d.id).toBe(true);
      expect(m.title.length, d.id).toBeLessThanOrEqual(110);
      expect(m.description.length, d.id).toBeLessThanOrEqual(160);
      expect(m.description.length, d.id).toBeGreaterThan(70);
      titles.add(m.title);
      descs.add(m.description);
    }
    expect(titles.size).toBe(REGISTRY.all.length);
    expect(descs.size).toBe(REGISTRY.all.length);
  });
  it('resolves a path back to its algorithm', () => {
    const d = REGISTRY.get('dijkstra-graph')!;
    expect(metaForPath(hrefFor({ id: d.id })).title).toContain(d.name);
    expect(metaForPath('/nope').noindex).toBe(true);
  });
});

describe('head tags', () => {
  it('has a canonical, robots, Open Graph, Twitter, and absolute JSON-LD URLs', () => {
    const html = headTags(metaForPath('/algorithms/bubble-sort'), ORIGIN);
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/algorithms/bubble-sort" />`);
    expect(html).toContain('content="index, follow');
    expect(html).toContain(`property="og:image" content="${ORIGIN}/og.png"`);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    expect(ld.map((x) => x['@type'])).toEqual(['LearningResource', 'BreadcrumbList']);
    expect(ld[0].url).toBe(`${ORIGIN}/algorithms/bubble-sort`);
    expect(ld[1].itemListElement.at(-1).item).toBe(`${ORIGIN}/algorithms/bubble-sort`);
  });
  it('escapes quotes so titles cannot break attributes', () => {
    const html = headTags({ title: 'A "quoted" <title>', description: 'x', path: '/', jsonLd: [] }, ORIGIN);
    expect(html).toContain('A &quot;quoted&quot; &lt;title&gt;');
  });
  it('marks missing pages noindex', () => {
    expect(headTags(metaForPath('/nope'), ORIGIN)).toContain('noindex, follow');
  });
});

describe('static page content', () => {
  it('shows the algorithm name, complexity, pseudocode, and internal links', () => {
    const d = REGISTRY.get('merge-sort')!;
    const body = bodyContent(hrefFor({ id: d.id }));
    expect(body).toContain('<h1>Merge Sort visualization</h1>');
    expect(body).toContain(d.complexity.worst);
    expect(body).toContain('<pre>');
    expect(body).toContain('href="/algorithms"');
    expect(body).toContain('href="/algorithms/quick-sort"');
  });
  it('the index links to every algorithm', () => {
    const body = bodyContent('/algorithms');
    for (const d of REGISTRY.all) expect(body, d.id).toContain(`href="${hrefFor({ id: d.id })}"`);
  });
  it('every page has exactly one h1', () => {
    for (const path of sitemapEntries().map((e) => e.path)) expect((bodyContent(path).match(/<h1>/g) ?? []).length, path).toBe(1);
  });
});

describe('renderPage, sitemap, robots', () => {
  it('fills the head marker and the root', () => {
    const out = renderPage(TEMPLATE, '/algorithms/bubble-sort', ORIGIN);
    expect(out).not.toContain('<!--seo-head-->');
    expect(out).toContain('<title>Bubble Sort Visualization');
    expect(out).toContain('<div id="root"><main class="seo">');
  });
  it('lists every page once in the sitemap', () => {
    const xml = sitemapXml(ORIGIN, sitemapEntries(), '2026-01-01');
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBe(REGISTRY.all.length + 3);
    expect(new Set(locs).size).toBe(locs.length);
    expect(locs).toContain(`${ORIGIN}/`);
    expect(locs).toContain(`${ORIGIN}/algorithms/quick-sort`);
    expect(locs.every((l) => !l.includes('?') && !l.includes('#'))).toBe(true);
  });
  it('robots allows crawling and points to the sitemap', () => {
    const txt = robotsTxt(ORIGIN);
    expect(txt).toContain('Allow: /');
    expect(txt).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
    expect(txt).not.toContain('Disallow');
  });
});
