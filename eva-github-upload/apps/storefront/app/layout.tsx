import type { Metadata } from 'next';
import SiteChrome from './components/SiteChrome';
import { DEFAULT_DESCRIPTION, siteUrl } from './lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'EVA | ایوا',
  description: DEFAULT_DESCRIPTION,
  applicationName: 'EVA',
  category: 'shopping',
  alternates: { canonical: '/' },
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'EVA',
    title: 'EVA | ایوا',
    description: DEFAULT_DESCRIPTION,
    url: siteUrl(),
  },
  twitter: {
    card: 'summary',
    title: 'EVA | ایوا',
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body><SiteChrome>{children}</SiteChrome></body>
    </html>
  );
}
