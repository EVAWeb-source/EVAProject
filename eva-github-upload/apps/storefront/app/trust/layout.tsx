import { publicMetadata } from '../lib/seo';

export const metadata = publicMetadata({
  title: 'مرکز اعتماد EVA',
  description: 'شفافیت قیمت، وزن، عیار، فاکتور و روند خرید در EVA؛ توضیح سازوکار اعتماد و اطلاعات قابل‌پیگیری هر قطعه.',
  path: '/trust',
});

export default function TrustLayout({children}:{children:React.ReactNode}){return children;}
