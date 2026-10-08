'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import FilterMenu, { type FilterOption } from '../components/FilterMenu';
import styles from './shop.module.css';

type Unit = { id:string; unitSku:string; exactWeightGram:string; currentPriceToman:string; status:string };
type ProductImage = { id:string; url:string; altText:string; role:string; sortOrder:number };
export type ShopProduct = { id:string; nameFa:string; slug:string; masterSku:string; purity:number; shortDescription?:string|null; images?:ProductImage[]; collection:{nameFa:string;slug:string}|null; units:Unit[] };
type PreparedProduct = { product:ShopProduct; code:string; label:string; minWeight:number; minPrice:number; searchText:string; originalIndex:number };
type SortKey = 'RECOMMENDED' | 'PRICE_ASC' | 'PRICE_DESC' | 'WEIGHT_ASC';

const categories: Record<string,string> = { NEC:'گردنبند', PEN:'آویز', BRA:'دستبند', RIN:'انگشتر', EAR:'گوشواره', SET:'ست', ANK:'پابند', CHM:'چارم' };
const categoryOrder=['NEC','PEN','BRA','RIN','EAR','SET','ANK','CHM'];
const weightOptions: FilterOption[] = [
  { value:'ALL', label:'همه وزن‌ها' },
  { value:'ULTRA', label:'کمتر از ۰.۷ گرم', note:'قطعه‌های بسیار سبک' },
  { value:'LIGHT', label:'۰.۷ تا ۱ گرم', note:'سبک و مناسب استفاده روزمره' },
  { value:'REGULAR', label:'۱ گرم و بیشتر', note:'قطعه‌های پرتر و سنگین‌تر' },
];
const sortOptions: FilterOption[] = [
  { value:'RECOMMENDED', label:'پیشنهادی' },
  { value:'PRICE_ASC', label:'قیمت: کم به زیاد' },
  { value:'PRICE_DESC', label:'قیمت: زیاد به کم' },
  { value:'WEIGHT_ASC', label:'وزن: سبک‌تر اول' },
];

function categoryCode(masterSku:string){ return masterSku.split('-')[2] ?? 'OTHER'; }
function formatPrice(value:number){ return new Intl.NumberFormat('fa-IR').format(value); }
function weight(value:number){ return new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(value)+' گرم'; }
function normalize(value:string){ return value.trim().toLocaleLowerCase('fa').replace(/ي/g,'ی').replace(/ك/g,'ک'); }
function primaryImage(product:ShopProduct){ const sorted=[...(product.images??[])].sort((a,b)=>a.sortOrder-b.sortOrder); return sorted.find((image)=>image.role==='MAIN')??sorted[0]; }
function Visual({code}:{code:string}){ const variant=code==='RIN'?styles.ring:code==='BRA'?styles.arc:code==='EAR'?styles.drop:code==='SET'?styles.double:styles.sun; return <div className={styles.visual+' '+variant}><span className={styles.chain}/><span className={styles.jewel}/></div>; }

export default function ShopClient({products}:{products:ShopProduct[]}){
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('ALL');
  const [collection,setCollection]=useState('ALL');
  const [weightBand,setWeightBand]=useState('ALL');
  const [sort,setSort]=useState<SortKey>('RECOMMENDED');
  const [wishlist,setWishlist]=useState<string[]>([]);
  const deferredQuery=useDeferredValue(query);

  useEffect(()=>{ try{ setWishlist(JSON.parse(window.localStorage.getItem('eva-wishlist')??'[]')); }catch{ setWishlist([]); } },[]);

  const prepared=useMemo<PreparedProduct[]>(()=>products.map((product,originalIndex)=>{
    const code=categoryCode(product.masterSku); const label=categories[code]??'سایر';
    const weights=product.units.map((unit)=>Number(unit.exactWeightGram)); const prices=product.units.map((unit)=>Number(unit.currentPriceToman));
    return { product, code, label, minWeight:weights.length?Math.min(...weights):Number.POSITIVE_INFINITY, minPrice:prices.length?Math.min(...prices):Number.POSITIVE_INFINITY, searchText:normalize([product.nameFa,product.shortDescription,product.masterSku,product.collection?.nameFa,label].filter(Boolean).join(' ')), originalIndex };
  }),[products]);

  const collections=useMemo(()=>Array.from(new Set(products.map((product)=>product.collection?.nameFa).filter(Boolean) as string[])),[products]);
  const collectionOptions=useMemo<FilterOption[]>(()=>[{value:'ALL',label:'همه کالکشن‌ها'},...collections.map((name)=>({value:name,label:name}))],[collections]);
  const availableCategoryCodes=useMemo(()=>new Set(prepared.map(item=>item.code)),[prepared]);

  const result=useMemo(()=>{
    const q=normalize(deferredQuery);
    const filtered=prepared.filter((item)=>{
      const {product,minWeight}=item;
      if(product.units.length===0)return false;
      return (!q||item.searchText.includes(q))
        &&(category==='ALL'||item.code===category)
        &&(collection==='ALL'||product.collection?.nameFa===collection)
        &&(weightBand==='ALL'||(weightBand==='ULTRA'&&minWeight<0.7)||(weightBand==='LIGHT'&&minWeight>=0.7&&minWeight<1)||(weightBand==='REGULAR'&&minWeight>=1));
    });
    return [...filtered].sort((a,b)=>{ if(sort==='PRICE_ASC')return a.minPrice-b.minPrice; if(sort==='PRICE_DESC')return b.minPrice-a.minPrice; if(sort==='WEIGHT_ASC')return a.minWeight-b.minWeight; return a.originalIndex-b.originalIndex; });
  },[prepared,deferredQuery,category,collection,weightBand,sort]);

  const filtersActive=Boolean(query||category!=='ALL'||collection!=='ALL'||weightBand!=='ALL'||sort!=='RECOMMENDED');
  function toggleWishlist(slug:string){ setWishlist((current)=>{ const next=current.includes(slug)?current.filter((item)=>item!==slug):[...current,slug]; window.localStorage.setItem('eva-wishlist',JSON.stringify(next)); window.dispatchEvent(new Event('eva-wishlist-change')); return next; }); }
  function reset(){ setQuery(''); setCategory('ALL'); setCollection('ALL'); setWeightBand('ALL'); setSort('RECOMMENDED'); }

  return <>
    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><span>فروشگاه</span></div>

    <section className={styles.shopHeader}>
      <div className={styles.shopTitle}><div><span>EVA SHOP</span><h1>فروشگاه</h1></div><p><strong>{new Intl.NumberFormat('fa-IR').format(result.length)}</strong> محصول برای انتخاب</p></div>
      <label className={styles.searchBox}><span aria-hidden="true">⌕</span><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="جستجوی محصول، کالکشن یا کد..." aria-label="جستجو در فروشگاه"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="پاک کردن جستجو">×</button>}</label>
    </section>

    <div className={styles.filterDock}>
      <nav className={styles.categoryTabs} aria-label="دسته‌بندی محصولات">
        <button type="button" className={category==='ALL'?styles.activeTab:''} onClick={()=>setCategory('ALL')}>همه</button>
        {categoryOrder.filter(code=>availableCategoryCodes.has(code)).map(code=><button type="button" key={code} className={category===code?styles.activeTab:''} onClick={()=>setCategory(code)}>{categories[code]}</button>)}
      </nav>
      <section className={styles.toolbar} aria-label="فیلتر و مرتب‌سازی محصولات">
        <div className={styles.toolbarIntro}><span>FILTER & SORT</span><strong>انتخابت را دقیق‌تر کن</strong></div>
        <div className={styles.tools}><FilterMenu label="کالکشن" value={collection} options={collectionOptions} onChange={setCollection}/><FilterMenu label="وزن" value={weightBand} options={weightOptions} onChange={setWeightBand}/><FilterMenu label="مرتب‌سازی" value={sort} options={sortOptions} onChange={(value)=>setSort(value as SortKey)}/></div>
      </section>
    </div>

    {filtersActive&&<div className={styles.filterState}><span>{new Intl.NumberFormat('fa-IR').format(result.length)} نتیجه با انتخاب فعلی</span><button type="button" onClick={reset}>پاک‌کردن همه فیلترها</button></div>}

    {result.length>0?<section className={styles.grid} aria-label="محصولات فروشگاه">{result.map((item)=>{ const product=item.product; const multiple=product.units.length>1; const liked=wishlist.includes(product.slug); const image=primaryImage(product); const href='/products/'+product.slug; return <article className={styles.card} key={product.id}><div className={styles.media}><button type="button" className={liked?styles.heart+' '+styles.heartActive:styles.heart} onClick={()=>toggleWishlist(product.slug)} aria-label={liked?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'}>{liked?'♥':'♡'}</button><Link href={href} prefetch={false} aria-label={product.nameFa}>{image?<img className={styles.productImage} src={image.url} alt={image.altText||product.nameFa} loading="lazy" decoding="async" width={800} height={1000}/>:<Visual code={item.code}/>}</Link></div><Link className={styles.cardBody} href={href} prefetch={false}><div className={styles.info}><div className={styles.infoTop}><div><h2>{product.nameFa}</h2><p>{item.label}{product.collection?' • کالکشن '+product.collection.nameFa:''}</p></div><span className={styles.purity}>{product.purity}K</span></div><div className={styles.meta}><span>{multiple?'از ':''}{weight(item.minWeight)}</span><div className={styles.priceTag}>{multiple?<em className={styles.pricePrefix}>از</em>:null}<small className={styles.priceCurrency}><span>تو</span><span>مان</span></small><strong className={styles.priceValue}>{formatPrice(item.minPrice)}</strong></div></div></div></Link></article>; })}</section>:<section className={styles.emptyState}><span>NO RESULTS</span><h2>محصولی با این انتخاب پیدا نشد.</h2><p>جستجو یا فیلترها را تغییر بده و دوباره محصولات را ببین.</p><button type="button" onClick={reset}>نمایش همه محصولات</button></section>}
  </>;
}
