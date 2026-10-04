import type { Metadata } from 'next';
import './globals.css';
import './order-details.css';
import './admin-v2.css';

export const metadata: Metadata = { title: 'EVA Admin' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
