'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import styles from './shop.module.css';

type Unit={id:string;unitSku:string;exactWeightGram:string;currentPriceToman:string;status:string};
type ProductImage={id:string;url:string;altText:string;role:string;sortOrder:number};
export type ShopProduct={id:string;nameFa:string;slug:string;masterSku:string;purity:number;shortDescription?:string|null;images?:ProductImage[];collection:{nameFa:string;slug:string}|null;units:Unit[]};
type PreparedProduct={product:ShopProduct;code:string;label:string;minWeight:number;minPrice:number;searchText:string;originalIndex:number};

const categories:Record<string,string>={NEC:'گردنبند',PEN:'آویز',BRA:'دستبند',RIN:'انگشتر',EAR:'گوشواره',SET:'ست',ANK:'پابند',CHM:'چارم'};
const categorySlugs:Record<string,string>={NEC:'necklaces',PEN:'pendants',BRA:'bracelets',RIN:'rings',EAR:'earrings',SET:'sets',ANK:'anklets',CHM:'charms'};
function categoryCode(masterSku:string){return masterSku.split('-')[2]??'OTHER';}
function toman(value:number){return new Intl.NumberFormat('fa-IR').format(value)+' تومان';}
function weight(value:number){return new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(value)+' گرم';}
function normalize(value:string){return value.trim().toLocaleLowerCase('fa').replace(/ي/g,'ی').replace(/ك/g,'ک');}
function Visual({code}:{code:string}){const variant=code==='RIN'?styles.ring:code==='BRA'?styles.arc:code==='EAR'?styles.drop:code==='SET'?styles.double:styles.sun;return <div className={styles.visual+' '+variant}><span className={styles.chain}/><span className={styles.jewel}/></div>;}

export default function ShopClient({products}:{products:ShopProduct[]}){
  const [query,setQuery]=useState('');const [category,setCategory]=useState('ALL');const [collection,setCollection]=useState('ALL');const [weightBand,setWeightBand]=useState('ALL');const [sort,setSort]=useState('RECOMMENDED');const [wishlist,setWishlist]=useState<string[]>([]);const searchRef=useRef<HTMLInputElement>(null);
  const deferredQuery=useDeferredValue(query);
  useEffect(()=>{try{setWishlist(JSON.parse(window.localStorage.getItem('eva-wishlist')??'[]'));}catch{setWishlist([]);}},[]);

  const prepared=useMemo<PreparedProduct[]>(()=>products.map((product,originalIndex)=>{
    const code=categoryCode(product.masterSku);
    const label=categories[code]??'سایر';
    const weights=product.units.map(unit=>Number(unit.exactWeightGram));
    const prices=product.units.map(unit=>Number(unit.currentPriceToman));
    return {
      product,
      code,
      label,
      minWeight:weights.length?Math.min(...weights):Number.POSITIVE_INFINITY,
      minPrice:prices.length?Math.min(...prices):Number.POSITIVE_INFINITY,
      searchText:normalize([product.nameFa,product.shortDescription,product.masterSku,product.collection?.nameFa,label].filter(Boolean).join(' ')),
      originalIndex,
    };
  }),[products]);

  const collections=useMemo(()=>Array.from(new Set(products.map(p=>p.collection?.nameFa).filter(Boolean) as string[])),[products]);
  const categoryCodes=useMemo(()=>Array.from(new Set(prepared.map(item=>item.code))),[prepared]);
  const result=useMemo(()=>{
    const q=normalize(deferredQuery);
    const filtered=prepared.filter(item=>{
      const {product,minWeight}=item;
      if(product.units.length===0)return false;
      return (!q||item.searchText.includes(q))&&(category==='ALL'||item.code===category)&&(collection==='ALL'||product.collection?.nameFa===collection)&&(weightBand==='ALL'||(weightBand==='ULTRA'&&minWeight<0.7)||(weightBand==='LIGHT'&&minWeight>=0.7&&minWeight<1)||(weightBand==='REGULAR'&&minWeight>=1));
    });
    return [...filtered].sort((a,b)=>{if(sort==='PRICE_ASC')return a.minPrice-b.minPrice;if(sort==='PRICE_DESC')return b.minPrice-a.minPrice;if(sort==='WEIGHT_ASC')return a.minWeight-b.minWeight;return a.originalIndex-b.originalIndex;});
  },[prepared,deferredQuery,category,collection,weightBand,sort]);

  function toggleWishlist(slug:string){setWishlist(current=>{const next=current.includes(slug)?current.filter(item=>item!==slug):[...current,slug];window.localStorage.setItem('eva-wishlist',JSON.stringify(next));window.dispatchEvent(new Event('eva-wishlist-change'));return next;});}
  function reset(){setQuery('');setCategory('ALL');setCollection('ALL');setWeightBand('ALL');setSort('RECOMMENDED');}

  return <>
    <section className={styles.intro}><div><span>EVA SHOP</span><h1>فروشگاه</h1><p>قطعه‌های موجود ایوا را بر اساس نوع، وزن و بودجه پیدا کن.</p></div><div className={styles.count}>{new Intl.NumberFormat('fa-IR').format(result.length)} محصول</div></section>
    <section className={styles.searchArea}><label className={styles.searchBox}><span>⌕</span><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در نام محصول، توضیح، کالکشن یا SKU" />{query&&<button onClick={()=>setQuery('')} aria-label="پاک کردن جستجو">×</button>}</label></section>
    <nav className={styles.categoryPages} aria-label="صفحه‌های دسته‌بندی"><span>دسته‌ها</span>{categoryCodes.map(code=><Link key={code} href={'/shop/'+(categorySlugs[code]??'')}>{categories[code]??code} ←</Link>)}</nav>
    <section className={styles.toolbar}><div className={styles.chips}><button className={category==='ALL'?styles.active:''} onClick={()=>setCategory('ALL')}>همه</button>{categoryCodes.map(code=><button key={code} className={category===code?styles.active:''} onClick={()=>setCategory(code)}>{categories[code]??code}</button>)}</div><div className={styles.tools}><select value={collection} onChange={e=>setCollection(e.target.value)} aria-label="کالکشن"><option value="ALL">همه کالکشن‌ها</option>{collections.map(name=><option key={name} value={name}>{name}</option>)}</select><select value={weightBand} onChange={e=>setWeightBand(e.target.value)} aria-label="وزن"><option value="ALL">همه وزن‌ها</option><option value="ULTRA">کمتر از ۰.۷ گرم</option><option value="LIGHT">۰.۷ تا ۱ گرم</option><option value="REGULAR">۱ گرم و بیشتر</option></select><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="مرتب‌سازی"><option value="RECOMMENDED">پیشنهادی</option><option value="NEWEST">جدیدترین</option><option value="PRICE_ASC">قیمت: کم به زیاد</option><option value="PRICE_DESC">قیمت: زیاد به کم</option><option value="WEIGHT_ASC">وزن: سبک‌تر اول</option></select></div></section>
    {(query||category!=='ALL'||collection!=='ALL'||weightBand!=='ALL'||sort!=='RECOMMENDED')&&<div className={styles.filterState}><span>{new Intl.NumberFormat('fa-IR').format(result.length)} نتیجه</span><button onClick={reset}>پاک‌کردن فیلترها</button></div>}
    {result.length>0?<section className={styles.grid}>{result.map(item=>{const product=item.product;const multiple=product.units.length>1;const liked=wishlist.includes(product.slug);const sorted=[...(product.images??[])].sort((a,b)=>a.sortOrder-b.sortOrder);const image=sorted.find(image=>image.role==='MAIN')??sorted[0];const href='/products/'+product.slug;return <article className={styles.card} key={product.id}><div className={styles.media}><button className={liked?styles.heart+' '+styles.heartActive:styles.heart} onClick={()=>toggleWishlist(product.slug)} aria-label={liked?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'}>{liked?'♥':'♡'}</button><Link href={href} prefetch={false} aria-label={product.nameFa}>{image?<img className={styles.productImage} src={image.url} alt={image.altText||product.nameFa} loading="lazy" decoding="async" width={800} height={1000}/>:<Visual code={item.code}/>}</Link></div><Link className={styles.cardBody} href={href} prefetch={false}><div className={styles.info}><div><h2>{product.nameFa}</h2><p>{item.label}{product.collection?' • کالکشن '+product.collection.nameFa:''}</p></div><div className={styles.meta}><span>{multiple?'از ':''}{weight(item.minWeight)}</span><strong>{multiple?'از ':''}{toman(item.minPrice)}</strong></div></div></Link></article>;})}</section>:<section className={styles.emptyState}><span>NO RESULTS</span><h2>محصولی با این فیلتر پیدا نشد.</h2><p>فیلترها را تغییر بده یا دوباره همه محصولات را ببین.</p><button onClick={reset}>نمایش همه محصولات</button></section>}
  </>;
}
