'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './CatalogGrid.module.css';

export type CatalogProduct = {
  id:string; nameFa:string; slug:string; masterSku:string; purity:number;
  shortDescription?:string|null;
  images?:Array<{id:string;url:string;altText:string;role:string;sortOrder:number}>;
  collection:{nameFa:string;slug:string}|null;
  units:Array<{id:string;unitSku:string;exactWeightGram:string;currentPriceToman:string;status:string}>;
};

const categoryLabels:Record<string,string>={NEC:'گردنبند',PEN:'آویز',BRA:'دستبند',RIN:'انگشتر',EAR:'گوشواره',SET:'ست',ANK:'پابند',CHM:'چارم'};
function code(sku:string){return sku.split('-')[2]??'OTHER';}
function category(sku:string){return categoryLabels[code(sku)]??'طلا';}
function formatPrice(value:number){return new Intl.NumberFormat('fa-IR').format(value);}
function weight(value:number){return new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(value)+' گرم';}

function Visual({sku}:{sku:string}){
  const value=code(sku);
  const variant=value==='RIN'?styles.ring:value==='BRA'?styles.arc:value==='EAR'?styles.drop:value==='SET'?styles.double:styles.sun;
  return <div className={styles.visual+' '+variant}><span className={styles.chain}/><span className={styles.jewel}/></div>;
}

export default function CatalogGrid({products,emptyTitle='هنوز محصولی در این بخش موجود نیست.',emptyText='با اضافه‌شدن محصولات جدید، این صفحه به‌صورت خودکار به‌روزرسانی می‌شود.',compact=false}:{products:CatalogProduct[];emptyTitle?:string;emptyText?:string;compact?:boolean}){
  const [wishlist,setWishlist]=useState<string[]>([]);
  useEffect(()=>{try{setWishlist(JSON.parse(localStorage.getItem('eva-wishlist')??'[]'));}catch{setWishlist([]);}},[]);
  const available=useMemo(()=>products.filter((product)=>product.units.length>0),[products]);

  function toggle(slug:string){setWishlist((current)=>{const next=current.includes(slug)?current.filter((item)=>item!==slug):[...current,slug];localStorage.setItem('eva-wishlist',JSON.stringify(next));window.dispatchEvent(new Event('eva-wishlist-change'));return next;});}

  if(available.length===0)return <section className={styles.empty}><span>COMING INTO VIEW</span><h2>{emptyTitle}</h2><p>{emptyText}</p><Link href="/shop">مشاهده فروشگاه</Link></section>;

  return <section className={compact?styles.grid+' '+styles.compact:styles.grid} aria-label="محصولات این دسته">{available.map((product)=>{
    const prices=product.units.map((unit)=>Number(unit.currentPriceToman));
    const weights=product.units.map((unit)=>Number(unit.exactWeightGram));
    const minPrice=Math.min(...prices); const minWeight=Math.min(...weights); const multiple=product.units.length>1; const liked=wishlist.includes(product.slug);
    const sortedImages=[...(product.images??[])].sort((a,b)=>a.sortOrder-b.sortOrder); const image=sortedImages.find((item)=>item.role==='MAIN')??sortedImages[0]; const href='/products/'+product.slug;
    return <article className={styles.card} key={product.id}><div className={styles.media}><button type="button" className={liked?styles.heart+' '+styles.liked:styles.heart} onClick={()=>toggle(product.slug)} aria-label={liked?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'}>{liked?'♥':'♡'}</button><Link href={href} prefetch={false} aria-label={product.nameFa}>{image?<img className={styles.productImage} src={image.url} alt={image.altText||product.nameFa} loading="lazy" decoding="async" width={800} height={1000}/>:<Visual sku={product.masterSku}/>}</Link></div><Link className={styles.info} href={href} prefetch={false}><div className={styles.topline}><div><h2>{product.nameFa}</h2><p>{category(product.masterSku)}{product.collection?' • '+product.collection.nameFa:''}</p></div><span>{product.purity}K</span></div><div className={styles.meta}><span>{multiple?'از ':''}{weight(minWeight)}</span><div className={styles.priceTag}>{multiple?<em className={styles.pricePrefix}>از</em>:null}<small className={styles.priceCurrency}><span>تو</span><span>مان</span></small><strong className={styles.priceValue}>{formatPrice(minPrice)}</strong></div></div></Link></article>;
  })}</section>;
}
