'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './product.module.css';

type PurchasePricing = {
  goldRateTomanPerGram:number;
  goldValueToman:number;
  makingToman:number;
  profitToman:number;
  taxToman:number;
  finalPriceToman:number;
  rateVersion:string;
  pricingFormulaVersion:string;
};

type PurchaseUnit = {
  id:string;
  unitSku:string;
  weight:string;
  price:number;
  pricing:PurchasePricing;
};

type ProductInfo = {
  name:string;
  slug:string;
  masterSku:string;
  collection:string;
  collectionSlug:string;
  category:string;
  purity:number;
  shortDescription?:string;
  imageUrl?:string;
};

type ProductPurchaseProps = { product:ProductInfo; units:PurchaseUnit[] };
type CartItem={
  productId:string;unitId:string;unitSku:string;name:string;collection:string;
  weight:string;purity:string;price:number;imageUrl?:string;slug:string;
};

function toman(value:number){
  return new Intl.NumberFormat('fa-IR').format(value);
}

function readCart():CartItem[]{
  try{
    const raw=window.localStorage.getItem('eva-cart');
    if(!raw)return [];
    const value=JSON.parse(raw);
    const items=Array.isArray(value)?value:[value];
    return items.filter((item):item is CartItem=>Boolean(item&&typeof item==='object'&&item.unitId));
  }catch{return [];}
}

export default function ProductPurchase({ product, units }: ProductPurchaseProps) {
  const [selected,setSelected]=useState<PurchaseUnit|null>(units[0]??null);
  const [added,setAdded]=useState(false);
  const [liked,setLiked]=useState(false);
  const [shareState,setShareState]=useState('');
  const [cartStatus,setCartStatus]=useState('');
  const subtitle=product.shortDescription||`${product.category} طلای ${product.purity} عیار، با وزن و قیمت شفاف.`;

  useEffect(()=>{
    try{
      const current:string[]=JSON.parse(window.localStorage.getItem('eva-wishlist')??'[]');
      setLiked(current.includes(product.slug));
    }catch{
      setLiked(false);
    }
  },[product.slug]);

  function toggleWishlist(){
    try{
      const current:string[]=JSON.parse(window.localStorage.getItem('eva-wishlist')??'[]');
      const next=current.includes(product.slug)?current.filter(item=>item!==product.slug):[...current,product.slug];
      window.localStorage.setItem('eva-wishlist',JSON.stringify(next));
      window.dispatchEvent(new Event('eva-wishlist-change'));
      setLiked(next.includes(product.slug));
    }catch{}
  }

  function addToCart(){
    if(!selected)return;
    const current=readCart();
    if(current.some(item=>item.unitId===selected.id)){
      setAdded(true);
      setCartStatus('این قطعه از قبل داخل سبد خرید است.');
      return;
    }
    if(current.length>=10){
      setAdded(false);
      setCartStatus('برای هر سفارش حداکثر ۱۰ قطعه می‌توانی انتخاب کنی.');
      return;
    }

    const cartItem:CartItem={
      productId:product.masterSku,
      unitId:selected.id,
      unitSku:selected.unitSku,
      name:product.name,
      collection:`کالکشن ${product.collection}`,
      weight:selected.weight,
      purity:`${product.purity} عیار`,
      price:selected.price,
      imageUrl:product.imageUrl,
      slug:product.slug,
    };
    const next=[...current,cartItem];
    window.localStorage.setItem('eva-cart',JSON.stringify(next));
    window.dispatchEvent(new Event('eva-cart-change'));
    setAdded(true);
    setCartStatus(next.length>1?`${new Intl.NumberFormat('fa-IR').format(next.length)} قطعه در سبد خرید داری.`:'قطعه انتخاب‌شده به سبد خرید اضافه شد.');
  }

  async function shareProduct(){
    try{
      if(navigator.share){
        await navigator.share({title:product.name,text:`${product.name} از ایوا`,url:window.location.href});
        setShareState('اشتراک‌گذاری شد');
      }else{
        await navigator.clipboard?.writeText(window.location.href);
        setShareState('لینک کپی شد');
      }
    }catch{
      setShareState('');
    }
    window.setTimeout(()=>setShareState(''),1800);
  }

  if(!selected){
    return <div className={styles.purchasePanel}>
      <Link className={styles.collectionLink} href={'/collections/'+product.collectionSlug}>کالکشن {product.collection}</Link>
      <div className={styles.titleRow}><div><span className={styles.productType}>{product.category}</span><h1>{product.name}</h1></div><button type="button" className={styles.iconAction} onClick={toggleWishlist} aria-label={liked?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'} aria-pressed={liked}>{liked?'♥':'♡'}</button></div>
      <p className={styles.subtitle}>{subtitle}</p>
      <div className={styles.soldOut}><span>در حال حاضر Unit قابل سفارش برای این محصول موجود نیست.</span><Link href="/shop">مشاهده محصولات موجود</Link></div>
    </div>;
  }

  const breakdown=selected.pricing;

  return <div className={styles.purchasePanel}>
    <div className={styles.purchaseTopline}>
      <Link className={styles.collectionLink} href={'/collections/'+product.collectionSlug}>کالکشن {product.collection}</Link>
      <span>{product.category}</span>
    </div>

    <div className={styles.titleRow}>
      <div><h1>{product.name}</h1></div>
      <button type="button" className={liked?styles.iconAction+' '+styles.iconActionActive:styles.iconAction} onClick={toggleWishlist} aria-label={liked?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'} aria-pressed={liked}>{liked?'♥':'♡'}</button>
    </div>
    <p className={styles.subtitle}>{subtitle}</p>

    <div className={styles.priceBlock}>
      <div className={styles.primaryPrice}><strong>{toman(selected.price)}</strong><span>تومان</span></div>
      <div className={styles.priceMeta}><span>{selected.weight}</span><i aria-hidden="true"/><span>{product.purity} عیار</span></div>
    </div>

    <div className={styles.selectorBlock}>
      <div className={styles.labelRow}><strong>انتخاب وزن</strong><span>هر گزینه یک قطعه واقعی با قیمت خودش است.</span></div>
      <div className={styles.units}>{units.map(unit=><button type="button" key={unit.id} className={selected.id===unit.id?styles.unitActive:''} onClick={()=>{setSelected(unit);setAdded(false);setCartStatus('');}} aria-pressed={selected.id===unit.id}><span>{unit.weight}</span><small>{toman(unit.price)} تومان</small></button>)}</div>
    </div>

    <div className={styles.selectedSku}><span>کد قطعه انتخاب‌شده</span><b dir="ltr">{selected.unitSku}</b></div>
    <div className={styles.availability}><span aria-hidden="true"/> موجود و قابل سفارش</div>

    <button type="button" className={added?styles.addToCart+' '+styles.addedToCart:styles.addToCart} onClick={addToCart}>{added?'✓ داخل سبد خرید':'افزودن به سبد خرید'}</button>
    {added&&<div className={styles.afterAdd}><Link href="/cart" className={styles.cartLink}><span>مشاهده سبد خرید</span><b aria-hidden="true">←</b></Link></div>}
    <div className={styles.actionStatus} aria-live="polite">{cartStatus||shareState}</div>

    <div className={styles.secondaryActions}>
      <button type="button" onClick={toggleWishlist}>{liked?'♥ ذخیره شده':'♡ ذخیره برای بعد'}</button>
      <button type="button" onClick={shareProduct}>{shareState||'اشتراک‌گذاری'}</button>
    </div>

    <div className={styles.serviceLinks}>
      <Link href="/trust"><span>اصالت و شفافیت</span><b>←</b></Link>
      <Link href="/shipping-returns"><span>ارسال و مرجوعی</span><b>←</b></Link>
    </div>

    <details className={styles.breakdown}>
      <summary className={styles.breakdownToggle}><span>جزئیات قیمت</span><b aria-hidden="true">＋</b></summary>
      <div className={styles.breakdownRows}>
        <div><span>نرخ پایه طلا / گرم</span><strong>{toman(breakdown.goldRateTomanPerGram)} تومان</strong></div>
        <div><span>ارزش طلا</span><strong>{toman(breakdown.goldValueToman)} تومان</strong></div>
        <div><span>اجرت</span><strong>{toman(breakdown.makingToman)} تومان</strong></div>
        <div><span>سود</span><strong>{toman(breakdown.profitToman)} تومان</strong></div>
        <div><span>مالیات</span><strong>{toman(breakdown.taxToman)} تومان</strong></div>
        <div className={styles.total}><span>قیمت نهایی این قطعه</span><strong>{toman(breakdown.finalPriceToman)} تومان</strong></div>
        <p>جزئیات بالا مربوط به همین Unit و وزن دقیق انتخاب‌شده است.</p>
      </div>
    </details>

    <div className={styles.microTrust}><span>وزن دقیق</span><span>فاکتور معتبر</span><span>ارسال امن</span></div>
  </div>;
}
