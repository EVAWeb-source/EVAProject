import type { Metadata } from 'next';
import SiteChrome from './components/SiteChrome';
import SiteAnalytics from './components/SiteAnalytics';
import { DEFAULT_DESCRIPTION, indexingEnabled, siteUrl } from './lib/seo';
import './globals.css';
import './polish.css';
import './approved-header.css';
import './home-final.css';
import './final-footer.css';
import './scroll-performance.css';
import './mobile-home.css';

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
    card: 'summary_large_image',
    title: 'EVA | ایوا',
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const base=siteUrl();
  const structuredData={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'Organization','@id':base+'/#organization',name:'EVA',alternateName:'ایوا',url:base},
      {'@type':'WebSite','@id':base+'/#website',url:base,name:'EVA | ایوا',inLanguage:'fa-IR',publisher:{'@id':base+'/#organization'},potentialAction:{'@type':'SearchAction',target:base+'/search?q={search_term_string}','query-input':'required name=search_term_string'}},
    ],
  };
  return (
    <html lang="fa" dir="rtl">
      <body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/><SiteAnalytics/><SiteChrome>{children}</SiteChrome></body>
    </html>
  );
}
