import type { MetadataRoute } from 'next';
import { absoluteUrl } from './lib/seo';

export const dynamic = 'force-dynamic';

type Product = { slug: string };

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

  try {
    const apiBase = process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
    const response = await fetch(`${apiBase}/api/v1/products`, { cache: 'no-store' });
    if (!response.ok) return entries;
    const products = (await response.json()) as Product[];
    for (const product of products) {
      if (!product?.slug) continue;
      entries.push({
        url: absoluteUrl(`/products/${product.slug}`),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  } catch {
    // Keep the static sitemap available even if the catalog API is temporarily unavailable.
  }

  return entries;
}
