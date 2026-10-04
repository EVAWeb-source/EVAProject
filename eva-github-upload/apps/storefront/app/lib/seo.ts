import type { Metadata } from 'next';

export const SITE_NAME = 'EVA';
export const SITE_NAME_FA = 'ایوا';
export const DEFAULT_DESCRIPTION = 'بوتیک آنلاین طلای مدرن EVA؛ طراحی ظریف، وزن و قیمت شفاف و خرید قابل‌پیگیری.';
const FALLBACK_SITE_URL = 'https://evaproject-production.up.railway.app';

export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? FALLBACK_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalized, siteUrl()).toString();
}

export function publicMetadata(input: {
  title: string;
  description?: string | null;
  path: string;
  images?: string[];
}): Metadata {
  const description = input.description?.trim() || DEFAULT_DESCRIPTION;
  const canonical = absoluteUrl(input.path);
  const images = (input.images ?? []).filter(Boolean).map(absoluteUrl);

  return {
    title: input.title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName: SITE_NAME,
      title: input.title,
      description,
      url: canonical,
      ...(images.length ? { images } : {}),
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title: input.title,
      description,
      ...(images.length ? { images } : {}),
    },
  };
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};
