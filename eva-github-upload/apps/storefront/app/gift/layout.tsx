import { publicMetadata } from '../lib/seo';

export const metadata = publicMetadata({
  title: 'هدیه طلا | EVA',
  description: 'پیدا کردن هدیه طلای EVA بر اساس بودجه، مناسبت و انتخابی شفاف از محصولات موجود.',
  path: '/gift',
});

export default function GiftLayout({children}:{children:React.ReactNode}){return children;}
