import { publicMetadata } from '../lib/seo';

export const metadata = publicMetadata({
  title: 'ارسال و مرجوعی | EVA',
  description: 'راهنمای ارسال سفارش، رهگیری و چارچوب مرجوعی در فروشگاه EVA.',
  path: '/shipping-returns',
});

export default function ShippingReturnsLayout({children}:{children:React.ReactNode}){return children;}
