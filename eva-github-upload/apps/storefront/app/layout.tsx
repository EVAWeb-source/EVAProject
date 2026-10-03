import type { Metadata } from 'next';
import SiteChrome from './components/SiteChrome';
import './globals.css';

export const metadata: Metadata = {
  title: 'EVA | ایوا',
  description: 'بوتیک آنلاین طلای مدرن EVA',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body><SiteChrome>{children}</SiteChrome></body>
    </html>
  );
}
