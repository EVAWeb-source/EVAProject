import { publicMetadata } from '../lib/seo';

export const metadata=publicMetadata({
  title:'شرایط استفاده و خرید | EVA',
  description:'شرایط استفاده، خرید، رزرو محصول و چارچوب سفارش در فروشگاه EVA.',
  path:'/terms',
});

export default function TermsLayout({children}:{children:React.ReactNode}){return children;}