/** Site-wide constants used by metadata, the sitemap, and the prerender step. */

/** Brand name. */
export const SITE_NAME = 'AlgoWiz';

/** One-line description of the whole site (home page meta description). */
export const SITE_DESCRIPTION = 'Free interactive algorithm visualizer. Step through 117 algorithms (sorting, searching, graphs, pathfinding, trees, dynamic programming) with plain-English explanations, live pseudocode, and complexity graphs.';

/** Short tagline for titles. */
export const SITE_TAGLINE = 'Interactive Algorithm Visualizer';

/** Social preview image path (1200 x 630). */
export const OG_IMAGE = '/og.png';

/** Authors, for structured data. */
export const AUTHORS = ['Mayank Karki', 'Nitin Kandpal', 'Swarit Kumar'];

/**
 * Public origin of the deployed site, without a trailing slash.
 * Precedence: an explicit `SITE_URL`, then Vercel's production domain, then the default project domain.
 * @param env - environment variables (process.env at build time)
 */
export function siteUrl(env: Record<string, string | undefined> = {}): string {
  const explicit = env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
  return 'https://algowiz-five.vercel.app';
}
