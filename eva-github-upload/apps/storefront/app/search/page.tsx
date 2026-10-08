import type { Metadata } from 'next';
import SearchClient from './SearchClient';
import type { CatalogProduct } from '../components/CatalogGrid';
import { publicMetadata } from '../lib/seo';
import styles from './search.module.css';

export const dynamic='force-dynamic';

export const metadata:Metadata=publicMetadata({
  title:'جستجو | ایوا',
  description:'جستجو میان محصولات، کالکشن‌ها و دسته‌های طلای ایوا.',
  path:'/search',
});

async function getProducts():Promise<CatalogProduct[]>{
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase+'/api/v1/products',{cache:'no-store'});
  if(!response.ok)throw new Error('Failed to load EVA catalog: '+response.status);
  return response.json();
}

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const [{q},products]=await Promise.all([searchParams,getProducts()]);
  return <main className={styles.page}><SearchClient products={products} initialQuery={q??''}/></main>;
}
