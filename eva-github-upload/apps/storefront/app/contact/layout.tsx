import { publicMetadata } from '../lib/seo';

export const metadata = publicMetadata({
  title: 'تماس با EVA',
  description: 'راه‌های ارتباط و پشتیبانی EVA برای سوالات قبل و بعد از خرید.',
  path: '/contact',
});

export default function ContactLayout({children}:{children:React.ReactNode}){return children;}
