'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './wishlist.module.css';

type Product={id:string;nameFa:string;slug:string;masterSku:string;purity:number;images?:Array<{url:string;altText:string;role:string;sortOrder:number}>;collection:{nameFa:string}|null;units:Array<{exactWeightGram:string;currentPriceToman:string;status:string}>};
function toman(value:number){return new Intl.NumberFormat('fa-IR').format(value)+' تومان';}
function weight(value:number){return new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(value)+' گرم';}
function category(masterSku:string){const labels:Record<string,string>={NEC:'گردنبند',PEN:'آویز',BRA:'دستبند',RIN:'انگشتر',EAR:'گوشواره',SET:'ست',ANK:'پابند',CHM:'چارم'};return labels[masterSku.split('-')[2]??'']??'طلا';}

export default function WishlistClient(){
  const [slugs,setSlugs]=useState<string[]>([]);const [products,setProducts]=useState<Product[]>([]);const [loading,setLoading]=useState(true);
  useEffect(()=>{try{setSlugs(JSON.parse(localStorage.getItem('eva-wishlist')??'[]'));}catch{setSlugs([]);}fetch('/api/catalog',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(setProducts).catch(()=>setProducts([])).finally(()=>setLoading(false));},[]);
  const items=useMemo(()=>products.filter(p=>slugs.includes(p.slug)),[products,slugs]);
  function remove(slug:string){const next=slugs.filter(item=>item!==slug);setSlugs(next);localStorage.setItem('eva-wishlist',JSON.stringify(next));window.dispatchEvent(new Event('eva-wishlist-change'));}

  return <main className={styles.page}>
    <header className={styles.header}><a className={styles.brand} href="/">EVA</a><div><a href="/shop">فروشگاه</a><a href="/cart">سبد</a></div></header>
    <section className={styles.intro}><span>WISHLIST</span><h1>علاقه‌مندی‌های من</h1><p>قطعه‌هایی که برای بعد نگه داشته‌ای، با قیمت و موجودی فعلی.</p></section>
    {loading?<div className={styles.empty}>در حال دریافت محصولات...</div>:items.length===0?<section className={styles.empty}><h2>هنوز چیزی اینجا نیست.</h2><p>از فروشگاه قلب کنار هر قطعه را بزن.</p><a href="/shop">رفتن به فروشگاه</a></section>:<section className={styles.grid}>{items.map(product=>{const minPrice=Math.min(...product.units.map(u=>Number(u.currentPriceToman)));const minWeight=Math.min(...product.units.map(u=>Number(u.exactWeightGram)));const sorted=[...(product.images??[])].sort((a,b)=>a.sortOrder-b.sortOrder);const image=sorted.find(item=>item.role==='MAIN')??sorted[0];return <article className={styles.card} key={product.id}><div className={styles.media}><button onClick={()=>remove(product.slug)} aria-label="حذف از علاقه‌مندی‌ها">×</button><a href={'/products/'+product.slug}>{image?<img src={image.url} alt={image.altText||product.nameFa} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>:<><span/><i/></>}</a></div><a href={'/products/'+product.slug} className={styles.info}><div><h2>{product.nameFa}</h2><p>{category(product.masterSku)}{product.collection?' • '+product.collection.nameFa:''}</p></div><span>{weight(minWeight)}</span><strong>{toman(minPrice)}</strong></a></article>;})}</section>}
  </main>;
}
