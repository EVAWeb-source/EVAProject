import { publicMetadata } from '../lib/seo';

export const metadata = publicMetadata({
  title: 'مرکز راهنمای EVA',
  description: 'راهنمای خرید، حساب کاربری، رهگیری سفارش، ارسال، مرجوعی و پاسخ به سوالات رایج EVA.',
  path: '/help',
});

export default function HelpLayout({children}:{children:React.ReactNode}){return children;}
