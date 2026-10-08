'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './wishlist.module.css';

type Product={id:string;nameFa:string;slug:string;masterSku:string;purity:number;images?:Array<{url:string;altText:string;role:string;sortOrder:number}>;collection:{nameFa:string}|null;units:Array<{exactWeightGram:string;currentPriceToman:string;status:string}>};

function formatPrice(value:number){return new Intl.NumberFormat('fa-IR').format(value);}
function weight(value:number){return new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(value)+' گرم';}
function category(masterSku:string){const labels:Record<string,string>={NEC:'گردنبند',PEN:'آویز',BRA:'دستبند',RIN:'انگشتر',EAR:'گوشواره',SET:'ست',ANK:'پابند',CHM:'چارم'};return labels[masterSku.split('-')[2]??'']??'طلا';}
function primaryImage(product:Product){const sorted=[...(product.images??[])].sort((a,b)=>a.sortOrder-b.sortOrder);return sorted.find(item=>item.role==='MAIN')??sorted[0];}

export default function WishlistClient({products}:{products:Product[]}){
  const [slugs,setSlugs]=useState<string[]>([]);

  useEffect(()=>{
    try{const value=JSON.parse(localStorage.getItem('eva-wishlist')??'[]');setSlugs(Array.isArray(value)?value:[]);}catch{setSlugs([]);}
  },[]);

  const items=useMemo(()=>products.filter(product=>slugs.includes(product.slug)),[products,slugs]);

  function remove(slug:string){
    const next=slugs.filter(item=>item!==slug);
    setSlugs(next);
    localStorage.setItem('eva-wishlist',JSON.stringify(next));
    window.dispatchEvent(new Event('eva-wishlist-change'));
  }

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><span>علاقه‌مندی‌ها</span></div>

    <section className={styles.intro}>
      <div><span>WISHLIST</span><h1>علاقه‌مندی‌های من</h1><p>قطعه‌هایی که برای بعد نگه داشته‌ای، با قیمت و موجودی فعلی.</p></div>
      <strong>{new Intl.NumberFormat('fa-IR').format(items.length)} قطعه</strong>
    </section>

    {items.length===0?<section className={styles.empty}><span>YOUR EDIT IS EMPTY</span><h2>هنوز چیزی اینجا نیست.</h2><p>در فروشگاه یا صفحه محصول، قلب کنار هر قطعه را بزن تا برای بعد نگهش داری.</p><Link href="/shop">مشاهده فروشگاه</Link></section>:
      <section className={styles.grid} aria-label="محصولات مورد علاقه">{items.map(product=>{
        const availableUnits=product.units.filter(unit=>unit.status==='AVAILABLE'||!unit.status);
        const units=availableUnits.length?availableUnits:product.units;
        const minPrice=Math.min(...units.map(unit=>Number(unit.currentPriceToman)));
        const minWeight=Math.min(...units.map(unit=>Number(unit.exactWeightGram)));
        const image=primaryImage(product);
        return <article className={styles.card} key={product.id}>
          <div className={styles.media}>
            <button type="button" onClick={()=>remove(product.slug)} aria-label={`حذف ${product.nameFa} از علاقه‌مندی‌ها`}>×</button>
            <Link href={'/products/'+product.slug} aria-label={product.nameFa}>{image?<img src={image.url} alt={image.altText||product.nameFa} loading="lazy" decoding="async"/>:<div className={styles.fallback}><span/><i/></div>}</Link>
          </div>
          <Link href={'/products/'+product.slug} className={styles.info}>
            <div className={styles.infoTop}><div><h2>{product.nameFa}</h2><p>{category(product.masterSku)}{product.collection?' • '+product.collection.nameFa:''}</p></div><span>{product.purity}K</span></div>
            <div className={styles.meta}><span>{weight(minWeight)}</span><div className={styles.priceTag}><small className={styles.priceCurrency}><span>تو</span><span>مان</span></small><strong className={styles.priceValue}>{formatPrice(minPrice)}</strong></div></div>
          </Link>
        </article>;
      })}</section>}

    {items.length>0&&<section className={styles.continue}><div><span>KEEP EXPLORING</span><h2>هنوز دنبال گزینه دیگری هستی؟</h2></div><Link href="/shop">ادامه خرید <span>←</span></Link></section>}
  </main>;
}
