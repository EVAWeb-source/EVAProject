'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './wishlist.module.css';

type Product={id:string;nameFa:string;slug:string;masterSku:string;purity:number;images?:Array<{url:string;altText:string;role:string;sortOrder:number}>;collection:{nameFa:string}|null;units:Array<{id:string;unitSku:string;exactWeightGram:string;currentPriceToman:string;status:string}>};
type SavedItem={productId:string;unitId:string;unitSku?:string;name:string;collection:string;weight:string;purity:string;price:number;imageUrl?:string;slug?:string};
type Tab='wishlist'|'saved';

function formatPrice(value:number){return new Intl.NumberFormat('fa-IR').format(value);}
function weight(value:number){return new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(value)+' گرم';}
function category(masterSku:string){const labels:Record<string,string>={NEC:'گردنبند',PEN:'آویز',BRA:'دستبند',RIN:'انگشتر',EAR:'گوشواره',SET:'ست',ANK:'پابند',CHM:'چارم'};return labels[masterSku.split('-')[2]??'']??'طلا';}
function primaryImage(product:Product){const sorted=[...(product.images??[])].sort((a,b)=>a.sortOrder-b.sortOrder);return sorted.find(item=>item.role==='MAIN')??sorted[0];}
function readSaved():SavedItem[]{try{const value=JSON.parse(localStorage.getItem('eva-saved-for-later')??'[]');return Array.isArray(value)?value.filter(item=>item&&typeof item==='object'&&item.unitId):[];}catch{return [];}}
function writeSaved(items:SavedItem[]){if(items.length)localStorage.setItem('eva-saved-for-later',JSON.stringify(items));else localStorage.removeItem('eva-saved-for-later');window.dispatchEvent(new Event('eva-saved-change'));}
function readCart():SavedItem[]{try{const value=JSON.parse(localStorage.getItem('eva-cart')??'[]');const items=Array.isArray(value)?value:[value];return items.filter(item=>item&&typeof item==='object'&&item.unitId);}catch{return [];}}

export default function WishlistClient({products}:{products:Product[]}){
  const [slugs,setSlugs]=useState<string[]>([]);
  const [savedItems,setSavedItems]=useState<SavedItem[]>([]);
  const [tab,setTab]=useState<Tab>('wishlist');

  function refresh(){try{const value=JSON.parse(localStorage.getItem('eva-wishlist')??'[]');setSlugs(Array.isArray(value)?value:[]);}catch{setSlugs([]);}setSavedItems(readSaved());}
  useEffect(()=>{
    refresh();
    const params=new URLSearchParams(window.location.search);if(params.get('tab')==='saved')setTab('saved');
    window.addEventListener('storage',refresh);window.addEventListener('eva-wishlist-change',refresh);window.addEventListener('eva-saved-change',refresh);
    return()=>{window.removeEventListener('storage',refresh);window.removeEventListener('eva-wishlist-change',refresh);window.removeEventListener('eva-saved-change',refresh);};
  },[]);

  const items=useMemo(()=>products.filter(product=>slugs.includes(product.slug)),[products,slugs]);
  function chooseTab(next:Tab){setTab(next);const url=next==='saved'?'/wishlist?tab=saved':'/wishlist';window.history.replaceState({},'',url);}
  function removeWishlist(slug:string){const next=slugs.filter(item=>item!==slug);setSlugs(next);localStorage.setItem('eva-wishlist',JSON.stringify(next));window.dispatchEvent(new Event('eva-wishlist-change'));}
  function removeSaved(unitId:string){const next=savedItems.filter(item=>item.unitId!==unitId);setSavedItems(next);writeSaved(next);}
  function moveToCart(item:SavedItem){const cart=readCart();if(!cart.some(entry=>entry.unitId===item.unitId)){const next=[...cart,item];localStorage.setItem('eva-cart',JSON.stringify(next));window.dispatchEvent(new Event('eva-cart-change'));}removeSaved(item.unitId);}

  const count=tab==='wishlist'?items.length:savedItems.length;
  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><span>{tab==='wishlist'?'علاقه‌مندی‌ها':'خریدهای بعدی'}</span></div>
    <section className={styles.intro}><div><span>{tab==='wishlist'?'WISHLIST':'BUY LATER'}</span><h1>{tab==='wishlist'?'علاقه‌مندی‌های من':'خریدهای بعدی'}</h1><p>{tab==='wishlist'?'محصولاتی که دوست داری، بدون تعهد به خرید.':'قطعه‌هایی که برای خرید بعدی کنار گذاشته‌ای؛ این لیست از علاقه‌مندی‌ها جداست.'}</p></div><strong>{new Intl.NumberFormat('fa-IR').format(count)} مورد</strong></section>

    <nav className={styles.tabs} aria-label="لیست‌های شخصی"><button className={tab==='wishlist'?styles.tabActive:''} onClick={()=>chooseTab('wishlist')}>♡ علاقه‌مندی‌ها <span>{new Intl.NumberFormat('fa-IR').format(items.length)}</span></button><button className={tab==='saved'?styles.tabActive:''} onClick={()=>chooseTab('saved')}>▱ خریدهای بعدی <span>{new Intl.NumberFormat('fa-IR').format(savedItems.length)}</span></button></nav>

    {tab==='wishlist'&&(items.length===0?<section className={styles.empty}><span>YOUR WISHLIST IS EMPTY</span><h2>هنوز چیزی اینجا نیست.</h2><p>قلب کنار هر محصول فقط برای علاقه‌مندی است و وارد لیست خریدهای بعدی نمی‌شود.</p><Link href="/shop">مشاهده فروشگاه</Link></section>:
      <section className={styles.grid} aria-label="محصولات مورد علاقه">{items.map(product=>{const availableUnits=product.units.filter(unit=>unit.status==='AVAILABLE'||!unit.status);const units=availableUnits.length?availableUnits:product.units;const minPrice=Math.min(...units.map(unit=>Number(unit.currentPriceToman)));const minWeight=Math.min(...units.map(unit=>Number(unit.exactWeightGram)));const image=primaryImage(product);return <article className={styles.card} key={product.id}><div className={styles.media}><button type="button" onClick={()=>removeWishlist(product.slug)} aria-label={`حذف ${product.nameFa} از علاقه‌مندی‌ها`}>×</button><Link href={'/products/'+product.slug} aria-label={product.nameFa}>{image?<img src={image.url} alt={image.altText||product.nameFa} loading="lazy" decoding="async"/>:<div className={styles.fallback}><span/><i/></div>}</Link></div><Link href={'/products/'+product.slug} className={styles.info}><div className={styles.infoTop}><div><h2>{product.nameFa}</h2><p>{category(product.masterSku)}{product.collection?' • '+product.collection.nameFa:''}</p></div><span>{product.purity}K</span></div><div className={styles.meta}><span>{weight(minWeight)}</span><div className={styles.priceTag}><small className={styles.priceCurrency}><span>تو</span><span>مان</span></small><strong className={styles.priceValue}>{formatPrice(minPrice)}</strong></div></div></Link></article>;})}</section>)}

    {tab==='saved'&&(savedItems.length===0?<section className={styles.empty}><span>BUY LATER IS EMPTY</span><h2>خریدی برای بعد نگه نداشتی.</h2><p>بوکمارک روی کارت محصول یا «ذخیره برای خرید بعدی» در صفحه محصول، این لیست را پر می‌کند.</p><Link href="/shop">مشاهده فروشگاه</Link></section>:
      <section className={styles.savedGrid} aria-label="خریدهای بعدی">{savedItems.map(item=><article className={styles.savedCard} key={item.unitId}><Link href={item.slug?`/products/${item.slug}`:'/shop'} className={styles.savedMedia}>{item.imageUrl?<img src={item.imageUrl} alt={item.name}/>:<div className={styles.fallback}><span/><i/></div>}</Link><div className={styles.savedInfo}><span>{item.collection}</span><h2>{item.name}</h2><p>{item.weight} · {item.purity}</p><small dir="ltr">{item.unitSku??item.unitId}</small><strong>{formatPrice(item.price)} <b>تومان</b></strong><div className={styles.savedActions}><button onClick={()=>moveToCart(item)}>انتقال به سبد</button><button onClick={()=>removeSaved(item.unitId)}>حذف</button></div></div></article>)}</section>)}

    {count>0&&<section className={styles.continue}><div><span>KEEP EXPLORING</span><h2>{tab==='wishlist'?'هنوز دنبال گزینه دیگری هستی؟':'می‌خواهی گزینه‌های بیشتری ببینی؟'}</h2></div><Link href="/shop">ادامه خرید <span>←</span></Link></section>}
  </main>;
}
