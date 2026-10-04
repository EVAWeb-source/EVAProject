import { publicMetadata } from '../lib/seo';

export const metadata = publicMetadata({
  title: 'درباره EVA',
  description: 'درباره EVA؛ بوتیک آنلاین طلای معاصر با تمرکز بر طراحی ظریف، شفافیت وزن و قیمت و تجربه خرید قابل اعتماد.',
  path: '/about',
});

export default function AboutLayout({children}:{children:React.ReactNode}){return children;}
