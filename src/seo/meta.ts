/** Per-page metadata: title, description, canonical path, and structured data. Shared by the browser and the build. */
import { REGISTRY } from '../algorithms';
import { familyMeta } from '../ui/family';
import { AUTHORS, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from './site';
import { hrefFor, INDEX_PATH } from '../core/routes';
import type { AlgorithmDef } from '../core/step';

/** Everything the head of a page needs. */
export interface PageMeta {
  title: string;
  description: string;
  /** Path of the canonical URL (no origin, no query). */
  path: string;
  /** Structured data objects (JSON-LD); origin-relative URLs are made absolute by the caller. */
  jsonLd: Array<Record<string, unknown>>;
  /** Tell search engines not to index (missing pages). */
  noindex?: boolean;
}

/** How many algorithms share each plain name, computed once. */
const NAME_COUNT = REGISTRY.all.reduce((m, d) => m.set(d.name, (m.get(d.name) ?? 0) + 1), new Map<string, number>());

/**
 * A name that is unique across the whole site. Names shared by several algorithms (the ten linked-list operations
 * exist for three list types; BFS and DFS exist for grids and graphs) get their group in front:
 * "Singly linked list: Insert at Head", "Graph traversal: Breadth-First Search".
 * @param def - the algorithm
 */
export function displayName(def: AlgorithmDef<any, any>): string {
  return (NAME_COUNT.get(def.name) ?? 0) > 1 && def.group ? `${def.group}: ${def.name}` : def.name;
}

/** Trims text to a length, cutting at a word boundary and adding an ellipsis when shortened. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[.,;:]$/, '')}…`;
}

/**
 * Metadata for one algorithm page.
 * The title leads with the algorithm name and the words people search for ("visualization", "animation").
 * @param def - the algorithm
 */
export function algorithmMeta(def: AlgorithmDef<any, any>): PageMeta {
  const fam = familyMeta(def.family);
  const c = def.complexity;
  const path = hrefFor({ id: def.id });
  const description = clip(
    `${displayName(def)}: ${def.summary} Interactive step-by-step visualization with pseudocode. Worst case ${c.worst} time, ${c.space} space.`,
    158,
  );
  return {
    title: `${displayName(def)} Visualization: Step-by-Step Animation and Complexity | ${SITE_NAME}`,
    description,
    path,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: `${displayName(def)} visualization`,
        description: def.summary,
        url: path,
        learningResourceType: 'Interactive simulation',
        interactivityType: 'active',
        educationalLevel: 'Undergraduate',
        inLanguage: 'en',
        isAccessibleForFree: true,
        teaches: displayName(def),
        about: { '@type': 'Thing', name: `${fam.label}: ${def.group ?? fam.label}` },
        author: AUTHORS.map((name) => ({ '@type': 'Person', name })),
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: '/' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: '/' },
          { '@type': 'ListItem', position: 2, name: 'Algorithms', item: INDEX_PATH },
          { '@type': 'ListItem', position: 3, name: fam.label, item: `${INDEX_PATH}#${def.family}` },
          { '@type': 'ListItem', position: 4, name: displayName(def), item: path },
        ],
      },
    ],
  };
}

/** Metadata for the home page. */
export function homeMeta(): PageMeta {
  return {
    title: `${SITE_NAME}: ${SITE_TAGLINE} for Sorting, Graphs, Trees and More`,
    description: SITE_DESCRIPTION,
    path: '/',
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: '/', description: SITE_DESCRIPTION, inLanguage: 'en' },
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: SITE_NAME,
        url: '/',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any (runs in the browser)',
        description: SITE_DESCRIPTION,
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: AUTHORS.map((name) => ({ '@type': 'Person', name })),
      },
    ],
  };
}

/** Metadata for the index of all algorithms. */
export function indexMeta(): PageMeta {
  return {
    title: `All ${REGISTRY.all.length} Algorithm Visualizations: Sorting, Graphs, Trees, DP | ${SITE_NAME}`,
    description: `Browse all ${REGISTRY.all.length} interactive algorithm visualizations: sorting, searching, linked lists, graphs and pathfinding, trees and heaps, dynamic programming, string matching, and classics.`,
    path: INDEX_PATH,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Algorithm visualizations',
        url: INDEX_PATH,
        hasPart: REGISTRY.all.map((d) => ({ '@type': 'LearningResource', name: `${displayName(d)} visualization`, url: hrefFor({ id: d.id }) })),
      },
    ],
  };
}

/** Metadata for the race page. */
export function raceMeta(): PageMeta {
  return {
    title: `Sorting Algorithm Race: Compare Bubble, Merge, Quick Sort Live | ${SITE_NAME}`,
    description: 'Race up to four sorting algorithms on the same data and watch comparisons, swaps, and steps side by side.',
    path: '/race',
    jsonLd: [],
  };
}

/** Metadata for unknown paths. They are not indexed. */
export function missingMeta(): PageMeta {
  return { title: `Page not found | ${SITE_NAME}`, description: SITE_DESCRIPTION, path: '/', jsonLd: [], noindex: true };
}

/**
 * Every indexable path with its change frequency and priority, for the sitemap.
 * @returns paths in a stable order: home, index, race, then every algorithm
 */
export function sitemapEntries(): Array<{ path: string; priority: number; changefreq: string }> {
  return [
    { path: '/', priority: 1, changefreq: 'weekly' },
    { path: INDEX_PATH, priority: 0.9, changefreq: 'weekly' },
    { path: '/race', priority: 0.6, changefreq: 'monthly' },
    ...REGISTRY.all.map((d) => ({ path: hrefFor({ id: d.id }), priority: 0.8, changefreq: 'monthly' })),
  ];
}
