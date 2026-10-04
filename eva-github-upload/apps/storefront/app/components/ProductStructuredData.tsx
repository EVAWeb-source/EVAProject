import { absoluteUrl } from '../lib/seo';

type Unit = { currentPriceToman: string | number; status: string };
type Image = { url: string };

export default function ProductStructuredData({
  name,
  slug,
  sku,
  purity,
  category,
  description,
  images,
  units,
}:{
  name:string;
  slug:string;
  sku:string;
  purity:number;
  category:string;
  description?:string|null;
  images:Image[];
  units:Unit[];
}){
  const available=units.filter(unit=>unit.status==='AVAILABLE');
  const prices=available.map(unit=>Number(unit.currentPriceToman)).filter(value=>Number.isFinite(value)&&value>0);
  const imageUrls=images.map(image=>image.url).filter(Boolean).map(url=>absoluteUrl(url));
  const url=absoluteUrl(`/products/${slug}`);
  const lowToman=prices.length?Math.min(...prices):null;
  const highToman=prices.length?Math.max(...prices):null;

  const data:Record<string,unknown>={
    '@context':'https://schema.org',
    '@type':'Product',
    name,
    sku,
    url,
    category,
    material:`طلای ${purity} عیار`,
    brand:{'@type':'Brand',name:'EVA'},
    ...(description?{description}:{}),
    ...(imageUrls.length?{image:imageUrls}:{}),
    ...(lowToman!==null&&highToman!==null?{
      offers:{
        '@type':'AggregateOffer',
        url,
        priceCurrency:'IRR',
        lowPrice:String(Math.round(lowToman*10)),
        highPrice:String(Math.round(highToman*10)),
        offerCount:prices.length,
        availability:'https://schema.org/InStock',
      },
    }:{}),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}}/>;
}
