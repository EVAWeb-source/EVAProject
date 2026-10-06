import type { Metadata } from 'next';
import SiteChrome from './components/SiteChrome';
import { DEFAULT_DESCRIPTION, indexingEnabled, siteUrl } from './lib/seo';
import './globals.css';
import './polish.css';
import './approved-header.css';
import './home-final.css';
import './final-footer.css';
import './scroll-performance.css';

const index = indexingEnabled();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'EVA | ایوا',
  description: DEFAULT_DESCRIPTION,
  applicationName: 'EVA',
  category: 'shopping',
  alternates: { canonical: '/' },
  robots: {
    index,
    follow: index,
    googleBot: { index, follow: index },
  },
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
