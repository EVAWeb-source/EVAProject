import type { MetadataRoute } from 'next';
import { absoluteUrl, indexingEnabled, siteUrl } from './lib/seo';

export default function robots(): MetadataRoute.Robots {
  if (!indexingEnabled()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
      host: siteUrl(),
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteUrl(),
  };
}
