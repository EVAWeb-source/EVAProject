import { publicMetadata } from '../lib/seo';

export const metadata = publicMetadata({
  title: 'کالکشن‌های EVA',
  description: 'کالکشن‌های طلای EVA؛ آغاز، رها و پیوند با زبان طراحی مینیمال و قطعه‌های ظریف.',
  path: '/collections',
});

export default function CollectionsLayout({children}:{children:React.ReactNode}){return children;}
