import { publicMetadata } from '../lib/seo';

export const metadata = publicMetadata({
  title: 'سوالات متداول EVA',
  description: 'پاسخ به سوالات متداول درباره خرید طلا، وزن و قیمت، سفارش، ارسال، فاکتور و مرجوعی در EVA.',
  path: '/faq',
});

export default function FaqLayout({children}:{children:React.ReactNode}){return children;}
