import { publicMetadata } from '../lib/seo';

export const metadata = publicMetadata({
  title: 'فروشگاه طلا | EVA',
  description: 'خرید آنلاین طلای ظریف EVA با نمایش وزن دقیق هر Unit، قیمت شفاف و موجودی واقعی.',
  path: '/shop',
});

export default function ShopLayout({children}:{children:React.ReactNode}){return children;}
