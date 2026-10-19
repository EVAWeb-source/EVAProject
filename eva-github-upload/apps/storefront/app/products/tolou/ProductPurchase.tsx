'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './product.module.css';
import extra from './ProductPurchaseExtras.module.css';

type PurchasePricing = {
  goldRateTomanPerGram:number;goldValueToman:number;makingToman:number;profitToman:number;taxToman:number;
  goldSubtotalBeforeTaxToman:number;goldFinalToman:number;stoneName:string|null;stoneCarat:number|null;stoneWeightGram:number|null;
  stonePriceTomanPerGram:number|null;stoneValueToman:number;finalPriceToman:number;rateVersion:string;pricingFormulaVersion:string;
};
type PurchaseUnit = {id:string;unitSku:string;weight:string;price:number;pricing:PurchasePricing};
type ProductInfo = {name:string;slug:string;masterSku:string;collection:string;collectionSlug:string;category:string;purity:number;shortDescription?:string;imageUrl?:string};
type ProductPurchaseProps = { product:ProductInfo; units:PurchaseUnit[] };
type CartItem={productId:string;unitId:string;unitSku:string;name:string;collection:string;weight:string;purity:string;price:number;imageUrl?:string;slug:string};

function toman(value:number){return new Intl.NumberFormat('fa-IR').format(value);}
function decimal(value:number){return new Intl.NumberFormat('fa-IR',{minimumFractionDigits:0,maximumFractionDigits:3}).format(value);}
function readCart():CartItem[]{try{const raw=window.localStorage.getItem('eva-cart');if(!raw)return [];const value=JSON.parse(raw);const items=Array.isArray(value)?value:[value];return items.filter((item):item is CartItem=>Boolean(item&&typeof item==='object'&&item.unitId));}catch{return [];}}
function readSaved():CartItem[]{try{const raw=window.localStorage.getItem('eva-saved-for-later');if(!raw)return [];const value=JSON.parse(raw);return Array.isArray(value)?value.filter((item):item is CartItem=>Boolean(item&&typeof item==='object'&&item.unitId)):[];}catch{return [];}}
function writeSaved(items:CartItem[]){if(items.length)window.localStorage.setItem('eva-saved-for-later',JSON.stringify(items));else window.localStorage.removeItem('eva-saved-for-later');window.dispatchEvent(new Event('eva-saved-change'));}

export default function ProductPurchase({ product, units }: ProductPurchaseProps) {
  const [selected,setSelected]=useState<PurchaseUnit|null>(units[0]??null);
  const [added,setAdded]=useState(false);
  const [liked,setLiked]=useState(false);
  const [saved,setSaved]=useState(false);
  const [shareState,setShareState]=useState('');
  const [cartStatus,setCartStatus]=useState('');
  const [miniCartOpen,setMiniCartOpen]=useState(false);
  const subtitle=product.shortDescription||`${product.category} طلای ${product.purity} عیار، با وزن و قیمت شفاف.`;

  useEffect(()=>{try{const current:string[]=JSON.parse(window.localStorage.getItem('eva-wishlist')??'[]');setLiked(current.includes(product.slug));}catch{setLiked(false);}},[product.slug]);
  useEffect(()=>{setSaved(Boolean(selected&&readSaved().some(item=>item.unitId===selected.id)));},[selected]);

  function toggleWishlist(){try{const current:string[]=JSON.parse(window.localStorage.getItem('eva-wishlist')??'[]');const next=current.includes(product.slug)?current.filter(item=>item!==product.slug):[...current,product.slug];window.localStorage.setItem('eva-wishlist',JSON.stringify(next));window.dispatchEvent(new Event('eva-wishlist-change'));setLiked(next.includes(product.slug));}catch{}}
  function currentItem():CartItem|null{if(!selected)return null;return {productId:product.masterSku,unitId:selected.id,unitSku:selected.unitSku,name:product.name,collection:`کالکشن ${product.collection}`,weight:selected.weight,purity:`${product.purity} عیار`,price:selected.price,imageUrl:product.imageUrl,slug:product.slug};}
  function toggleSaveLater(){const item=currentItem();if(!item)return;const current=readSaved();const exists=current.some(entry=>entry.unitId===item.unitId);const next=exists?current.filter(entry=>entry.unitId!==item.unitId):[...current,item];writeSaved(next);setSaved(!exists);}
  function addToCart(){if(!selected)return;const current=readCart();if(current.some(item=>item.unitId===selected.id)){setAdded(true);setCartStatus('این قطعه از قبل داخل سبد خرید است.');setMiniCartOpen(true);return;}if(current.length>=10){setAdded(false);setCartStatus('برای هر سفارش حداکثر ۱۰ قطعه می‌توانی انتخاب کنی.');return;}const cartItem=currentItem();if(!cartItem)return;const next=[...current,cartItem];window.localStorage.setItem('eva-cart',JSON.stringify(next));window.dispatchEvent(new Event('eva-cart-change'));writeSaved(readSaved().filter(item=>item.unitId!==selected.id));setSaved(false);setAdded(true);setCartStatus('قطعه انتخاب‌شده به سبد خرید اضافه شد.');setMiniCartOpen(true);}
  async function shareProduct(){try{if(navigator.share){await navigator.share({title:product.name,text:`${product.name} از ایوا`,url:window.location.href});setShareState('اشتراک‌گذاری شد');}else{await navigator.clipboard?.writeText(window.location.href);setShareState('لینک کپی شد');}}catch{setShareState('');}window.setTimeout(()=>setShareState(''),1800);}

  if(!selected){return <div className={styles.purchasePanel}>
    <div className={styles.purchaseTopline}><Link className={styles.collectionLink} href={'/collections/'+product.collectionSlug}>کالکشن {product.collection}</Link><span>{product.category}</span></div>
    <div className={styles.titleRow}><div><h1>{product.name}</h1></div><button type="button" className={styles.iconAction} onClick={toggleWishlist} aria-label="افزودن به علاقه‌مندی‌ها">{liked?'♥':'♡'}</button></div>
    <p className={styles.subtitle}>{subtitle}</p>
    <div className={styles.soldOut}><span>در حال حاضر این محصول موجود نیست.</span><Link href="/shop">مشاهده محصولات موجود</Link></div>
  </div>;}

  const breakdown=selected.pricing;
  const hasStone=breakdown.stoneValueToman>0||breakdown.stoneCarat!==null||breakdown.stoneWeightGram!==null||breakdown.stonePriceTomanPerGram!==null;

  return <>
    <div className={styles.purchasePanel}>
      <div className={styles.purchaseTopline}><Link className={styles.collectionLink} href={'/collections/'+product.collectionSlug}>کالکشن {product.collection}</Link><span>{product.category}</span></div>

      <div className={styles.titleRow}>
        <div><h1>{product.name}</h1></div>
        <button type="button" className={liked?styles.iconAction+' '+styles.iconActionActive:styles.iconAction} onClick={toggleWishlist} aria-pressed={liked} aria-label="علاقه‌مندی">{liked?'♥':'♡'}</button>
      </div>
      <p className={styles.subtitle}>{subtitle}</p>

      <div className={styles.priceBlock}>
        <div className={styles.primaryPrice}><strong>{toman(selected.price)}</strong><span>تومان</span></div>
        <div className={styles.priceMeta}><span>{selected.weight}</span><i/><span>{product.purity} عیار</span>{hasStone&&<><i/><span className={styles.stoneMeta}>{decimal(breakdown.stoneCarat??0)} قیراط {breakdown.stoneName??'سنگ'}</span></>}</div>
      </div>

      <div className={styles.selectorBlock}>
        <div className={styles.labelRow}><strong>انتخاب وزن</strong><span>{units.length} گزینه موجود</span></div>
        <div className={styles.units}>{units.map(unit=><button type="button" key={unit.id} className={selected.id===unit.id?styles.unitActive:''} onClick={()=>{setSelected(unit);setAdded(false);setCartStatus('');}}><span>{unit.weight}</span><small>{toman(unit.price)} تومان</small></button>)}</div>
      </div>

      <div className={styles.selectedSku}><span>کد قطعه</span><b dir="ltr">{selected.unitSku}</b></div>
      <div className={styles.availability}><span/> آماده سفارش و ارسال امن</div>

      <button type="button" className={added?styles.addToCart+' '+styles.addedToCart:styles.addToCart} onClick={addToCart}>{added?'✓ داخل سبد خرید':'افزودن به سبد خرید'}</button>
      <div className={styles.actionStatus}>{cartStatus||shareState}</div>

      <div className={styles.microTrust} aria-label="مزیت‌های خرید این محصول">
        <div><i aria-hidden="true">✓</i><span><strong>وزن دقیق</strong><small>وزن همین قطعه قبل از خرید مشخص است</small></span></div>
        <div><i aria-hidden="true">⌁</i><span><strong>فاکتور معتبر</strong><small>جزئیات خرید و قیمت شفاف ثبت می‌شود</small></span></div>
        <div><i aria-hidden="true">◇</i><span><strong>ارسال امن</strong><small>بسته‌بندی مطمئن تا تحویل سفارش</small></span></div>
      </div>

      <div className={styles.secondaryActions}>
        <button type="button" className={saved?styles.secondaryActionActive:''} onClick={toggleSaveLater}>
          <i aria-hidden="true">{saved?'✓':'＋'}</i><span><strong>{saved?'برای بعد ذخیره شد':'ذخیره برای بعد'}</strong><small>{saved?'از لیست ذخیره‌ها قابل دسترسی است':'اگر هنوز برای خرید مطمئن نیستی'}</small></span>
        </button>
        <button type="button" onClick={shareProduct}>
          <i aria-hidden="true">↗</i><span><strong>{shareState||'اشتراک‌گذاری'}</strong><small>ارسال لینک این محصول برای دیگران</small></span>
        </button>
      </div>

      {hasStone&&<div className={styles.stoneHighlight}><div><span>STONE DETAILS</span><strong>{breakdown.stoneName??'سنگ'}</strong></div><dl><div><dt>قیراط</dt><dd>{decimal(breakdown.stoneCarat??0)}</dd></div><div><dt>وزن سنگ</dt><dd>{decimal(breakdown.stoneWeightGram??0)} گرم</dd></div><div><dt>ارزش سنگ</dt><dd>{toman(breakdown.stoneValueToman)} تومان</dd></div></dl></div>}

      <details className={styles.breakdown}>
        <summary className={styles.breakdownToggle}><span><small>PRICE TRANSPARENCY</small><strong>جزئیات قیمت</strong></span><b aria-hidden="true">＋</b></summary>
        <div className={styles.breakdownRows}>
          <section><h3>طلا</h3><div><span>نرخ تابلو / گرم</span><strong>{toman(breakdown.goldRateTomanPerGram)} تومان</strong></div><div><span>ارزش طلای خالص</span><strong>{toman(breakdown.goldValueToman)} تومان</strong></div><div><span>اجرت</span><strong>{toman(breakdown.makingToman)} تومان</strong></div><div><span>سود</span><strong>{toman(breakdown.profitToman)} تومان</strong></div><div><span>مالیات اجرت و سود</span><strong>{toman(breakdown.taxToman)} تومان</strong></div><div className={styles.subtotal}><span>قیمت نهایی طلا</span><strong>{toman(breakdown.goldFinalToman)} تومان</strong></div></section>
          {hasStone&&<section className={styles.stonePriceSection}><h3>سنگ</h3><div><span>نوع سنگ</span><strong>{breakdown.stoneName??'سنگ'}</strong></div><div><span>قیراط</span><strong>{decimal(breakdown.stoneCarat??0)} قیراط</strong></div><div><span>وزن سنگ</span><strong>{decimal(breakdown.stoneWeightGram??0)} گرم</strong></div><div><span>قیمت هر گرم سنگ</span><strong>{toman(breakdown.stonePriceTomanPerGram??0)} تومان</strong></div><div className={styles.subtotal}><span>قیمت سنگ</span><strong>{toman(breakdown.stoneValueToman)} تومان</strong></div></section>}
          <div className={styles.total}><span>قیمت نهایی</span><strong>{toman(breakdown.finalPriceToman)} تومان</strong></div>
          <p>{hasStone?'قیمت نهایی شامل طلای قطعه و ارزش سنگ است. مالیات فعلی فقط روی اجرت و سود طلا محاسبه می‌شود.':'مالیات فقط روی اجرت و سود طلا محاسبه شده است.'}</p>
        </div>
      </details>
    </div>

    {miniCartOpen&&<div className={extra.miniCartBackdrop} role="presentation" onMouseDown={event=>{if(event.currentTarget===event.target)setMiniCartOpen(false);}}><div className={extra.miniCart} role="dialog" aria-modal="true"><button className={extra.miniCartClose} type="button" onClick={()=>setMiniCartOpen(false)}>×</button><span className={extra.miniCartEyebrow}>ADDED TO CART</span><h2>{product.name}</h2><div className={extra.miniCartItem}>{product.imageUrl?<img src={product.imageUrl} alt=""/>:<div className={extra.miniCartFallback}/>}<div><strong>{selected.weight}</strong><span dir="ltr">{selected.unitSku}</span><b>{toman(selected.price)} تومان</b></div></div><div className={extra.miniCartActions}><Link href="/cart">مشاهده سبد خرید</Link><button type="button" onClick={()=>setMiniCartOpen(false)}>ادامه خرید</button></div></div></div>}
  </>;
}
