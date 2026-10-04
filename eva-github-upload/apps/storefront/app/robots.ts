import type { MetadataRoute } from 'next';
import { absoluteUrl, siteUrl } from './lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/account',
        '/cart',
        '/checkout',
        '/invoice/',
        '/payment/',
        '/track-order',
        '/verify/',
        '/wishlist',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteUrl(),
  };
}
