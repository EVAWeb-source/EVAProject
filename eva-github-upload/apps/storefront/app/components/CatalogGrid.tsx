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

type SavedItem={productId:string;unitId:string;unitSku:string;name:string;collection:string;weight:string;purity:string;price:number;imageUrl?:string;slug:string};

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
function Bookmark({filled}:{filled:boolean}){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h10v15l-5-3.2-5 3.2v-15Z" fill={filled?'currentColor':'none'}/></svg>;}

export default function CatalogGrid({products,emptyTitle='هنوز محصولی در این بخش موجود نیست.',emptyText='با اضافه‌شدن محصولات جدید، این صفحه به‌صورت خودکار به‌روزرسانی می‌شود.',compact=false}:{products:CatalogProduct[];emptyTitle?:string;emptyText?:string;compact?:boolean}){
  const [wishlist,setWishlist]=useState<string[]>([]);
  const [savedUnitIds,setSavedUnitIds]=useState<string[]>([]);

  useEffect(()=>{
    try{setWishlist(JSON.parse(localStorage.getItem('eva-wishlist')??'[]'));}catch{setWishlist([]);}
    try{const value=JSON.parse(localStorage.getItem('eva-saved-for-later')??'[]');setSavedUnitIds(Array.isArray(value)?value.map((item:SavedItem)=>item?.unitId).filter(Boolean):[]);}catch{setSavedUnitIds([]);}
  },[]);

  const available=useMemo(()=>products.filter((product)=>product.units.length>0),[products]);

  function toggleWishlist(slug:string){setWishlist((current)=>{const next=current.includes(slug)?current.filter((item)=>item!==slug):[...current,slug];localStorage.setItem('eva-wishlist',JSON.stringify(next));window.dispatchEvent(new Event('eva-wishlist-change'));return next;});}

  function toggleSaved(product:CatalogProduct,imageUrl:string|undefined){
    const unit=[...product.units].sort((a,b)=>Number(a.currentPriceToman)-Number(b.currentPriceToman))[0];
    if(!unit)return;
    try{
      const raw=JSON.parse(localStorage.getItem('eva-saved-for-later')??'[]');
      const current:SavedItem[]=Array.isArray(raw)?raw:[];
      const exists=current.some(item=>item.unitId===unit.id);
      const next=exists?current.filter(item=>item.unitId!==unit.id):[...current,{
        productId:product.masterSku,unitId:unit.id,unitSku:unit.unitSku,name:product.nameFa,
        collection:product.collection?`کالکشن ${product.collection.nameFa}`:'ایوا',weight:weight(Number(unit.exactWeightGram)),
        purity:`${product.purity} عیار`,price:Number(unit.currentPriceToman),imageUrl,slug:product.slug,
      }];
      if(next.length)localStorage.setItem('eva-saved-for-later',JSON.stringify(next));else localStorage.removeItem('eva-saved-for-later');
      setSavedUnitIds(next.map(item=>item.unitId));
      window.dispatchEvent(new Event('eva-saved-change'));
    }catch{}
  }

  if(available.length===0)return <section className={styles.empty}><span>COMING INTO VIEW</span><h2>{emptyTitle}</h2><p>{emptyText}</p><Link href="/shop">مشاهده فروشگاه</Link></section>;

  return <section className={compact?styles.grid+' '+styles.compact:styles.grid} aria-label="محصولات این دسته">{available.map((product)=>{
    const prices=product.units.map((unit)=>Number(unit.currentPriceToman));
    const weights=product.units.map((unit)=>Number(unit.exactWeightGram));
    const minPrice=Math.min(...prices); const minWeight=Math.min(...weights); const multiple=product.units.length>1; const liked=wishlist.includes(product.slug);
    const preferred=[...product.units].sort((a,b)=>Number(a.currentPriceToman)-Number(b.currentPriceToman))[0];
    const saved=preferred?savedUnitIds.includes(preferred.id):false;
    const sortedImages=[...(product.images??[])].sort((a,b)=>a.sortOrder-b.sortOrder); const image=sortedImages.find((item)=>item.role==='MAIN')??sortedImages[0]; const href='/products/'+product.slug;
    return <article className={styles.card} key={product.id}><div className={styles.media}>
      <button type="button" className={liked?styles.heart+' '+styles.liked:styles.heart} onClick={()=>toggleWishlist(product.slug)} aria-label={liked?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'}>{liked?'♥':'♡'}</button>
      <button type="button" className={saved?styles.saveLater+' '+styles.saved:styles.saveLater} onClick={()=>toggleSaved(product,image?.url)} aria-label={saved?'حذف از خریدهای بعدی':'ذخیره برای خرید بعدی'} title="خرید بعدی"><Bookmark filled={saved}/></button>
      <Link href={href} prefetch={false} aria-label={product.nameFa}>{image?<img className={styles.productImage} src={image.url} alt={image.altText||product.nameFa} loading="lazy" decoding="async" width={800} height={1000}/>:<Visual sku={product.masterSku}/>}</Link>
    </div><Link className={styles.info} href={href} prefetch={false}><div className={styles.topline}><div><h2>{product.nameFa}</h2><p>{category(product.masterSku)}{product.collection?' • '+product.collection.nameFa:''}</p></div><span>{product.purity}K</span></div><div className={styles.meta}><span>{multiple?'از ':''}{weight(minWeight)}</span><div className={styles.priceTag}>{multiple?<em className={styles.pricePrefix}>از</em>:null}<small className={styles.priceCurrency}><span>تو</span><span>مان</span></small><strong className={styles.priceValue}>{formatPrice(minPrice)}</strong></div></div></Link></article>;
  })}</section>;
}
