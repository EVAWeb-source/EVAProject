import type { Metadata } from 'next';
import WishlistClient from './WishlistClient';
import { publicMetadata } from '../lib/seo';

export const dynamic='force-dynamic';

export const metadata:Metadata=publicMetadata({
  title:'لیست‌های من | ایوا',
  description:'علاقه‌مندی‌ها و خریدهای بعدی ایوا، با موجودی و قیمت فعلی.',
  path:'/wishlist',
});

type Product={id:string;nameFa:string;slug:string;masterSku:string;purity:number;images?:Array<{url:string;altText:string;role:string;sortOrder:number}>;collection:{nameFa:string}|null;units:Array<{id:string;unitSku:string;exactWeightGram:string;currentPriceToman:string;status:string}>};

async function getProducts():Promise<Product[]>{
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase+'/api/v1/products',{cache:'no-store'});
  if(!response.ok)throw new Error('Failed to load EVA catalog: '+response.status);
  return response.json();
}

export default async function WishlistPage(){
  const products=await getProducts();
  return <WishlistClient products={products}/>;
}
