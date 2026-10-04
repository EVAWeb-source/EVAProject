import type { MetadataRoute } from 'next';
import { absoluteUrl } from './lib/seo';

export const dynamic = 'force-dynamic';

type Product = { slug: string; collection?: { slug?: string | null } | null };

const staticRoutes = [
  '/',
  '/shop',
  '/collections',
  '/collections/aghaz',
  '/collections/raha',
  '/collections/peyvand',
  '/shop/necklaces',
  '/shop/pendants',
  '/shop/bracelets',
  '/shop/rings',
  '/shop/earrings',
  '/shop/sets',
  '/shop/anklets',
  '/shop/charms',
  '/gift',
  '/lightweight',
  '/about',
  '/trust',
  '/help',
  '/faq',
  '/shipping-returns',
  '/contact',
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/shop' ? 0.9 : 0.7,
  }));
  const knownUrls = new Set(entries.map((entry) => entry.url));

  try {
    const apiBase = process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
    const response = await fetch(`${apiBase}/api/v1/products`, { cache: 'no-store' });
    if (!response.ok) return entries;
    const products = (await response.json()) as Product[];
    for (const product of products) {
      if (product?.slug) {
        const productUrl = absoluteUrl(`/products/${product.slug}`);
        if (!knownUrls.has(productUrl)) {
          entries.push({ url: productUrl, changeFrequency: 'daily', priority: 0.8 });
          knownUrls.add(productUrl);
        }
      }
      const collectionSlug = product?.collection?.slug;
      if (collectionSlug) {
        const collectionUrl = absoluteUrl(`/collections/${collectionSlug}`);
        if (!knownUrls.has(collectionUrl)) {
          entries.push({ url: collectionUrl, changeFrequency: 'weekly', priority: 0.7 });
          knownUrls.add(collectionUrl);
        }
      }
    }
  } catch {
    // Keep the static sitemap available even if the catalog API is temporarily unavailable.
  }

  return entries;
}
