'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './cart.module.css';

type CartItem = {
  productId:string;
  unitId:string;
  unitSku?:string;
  name:string;
  collection:string;
  weight:string;
  purity:string;
  price:number;
  imageUrl?:string;
  slug?:string;
};

type GiftState = { enabled:boolean; message:string; hidePrice:boolean };
type StoredReservation={token:string;unitId:string;expiresAt:string};

const apiBase=process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';
const emptyGift:GiftState={enabled:false,message:'',hidePrice:true};
const savedLaterKey='eva-saved-for-later';

function toman(value:number){return new Intl.NumberFormat('fa-IR').format(value);}
function normalizeItems(value:unknown):CartItem[]{
  const items=Array.isArray(value)?value:[value];
  return items.filter((item):item is CartItem=>Boolean(item&&typeof item==='object'&&(item as CartItem).unitId&&(item as CartItem).name));
}
function readCart():CartItem[]{
  try{
    const raw=window.localStorage.getItem('eva-cart');
    if(!raw)return [];
    return normalizeItems(JSON.parse(raw));
  }catch{return [];}
}
function readSavedLater():CartItem[]{
  try{
    const raw=window.localStorage.getItem(savedLaterKey);
    if(!raw)return [];
    return normalizeItems(JSON.parse(raw));
  }catch{return [];}
}
function writeCart(items:CartItem[]){
  if(items.length)window.localStorage.setItem('eva-cart',JSON.stringify(items));
  else window.localStorage.removeItem('eva-cart');
  window.dispatchEvent(new Event('eva-cart-change'));
}
function writeSavedLater(items:CartItem[]){
  if(items.length)window.localStorage.setItem(savedLaterKey,JSON.stringify(items));
  else window.localStorage.removeItem(savedLaterKey);
}

export default function CartPage(){
  const [items,setItems]=useState<CartItem[]>([]);
  const [savedItems,setSavedItems]=useState<CartItem[]>([]);
  const [gift,setGift]=useState<GiftState>(emptyGift);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    const current=readCart();
    const saved=readSavedLater();
    setItems(current);
    setSavedItems(saved);
    writeCart(current);
    writeSavedLater(saved);

    try{
      const giftRaw=window.localStorage.getItem('eva-gift-order');
      if(giftRaw)setGift({...emptyGift,...JSON.parse(giftRaw)});
    }catch{window.localStorage.removeItem('eva-gift-order');}
    setReady(true);
  },[]);

  useEffect(()=>{
    if(!ready)return;
    if(gift.enabled)window.localStorage.setItem('eva-gift-order',JSON.stringify(gift));
    else window.localStorage.removeItem('eva-gift-order');
  },[gift,ready]);

  const total=useMemo(()=>items.reduce((sum,item)=>sum+Number(item.price||0),0),[items]);

  async function releaseReservationFor(unitId:string){
    let reservations:StoredReservation[]=[];
    try{
      const raw=window.localStorage.getItem('eva-reservations');
      if(raw){
        const parsed=JSON.parse(raw);
        reservations=Array.isArray(parsed)?parsed:[];
      }
    }catch{}

    const matching=reservations.filter(item=>item.unitId===unitId);
    await Promise.all(matching.map(item=>fetch(`${apiBase}/api/v1/reservations/${encodeURIComponent(item.token)}/release`,{method:'POST'}).catch(()=>undefined)));
    const remaining=reservations.filter(item=>item.unitId!==unitId);
    if(remaining.length)window.localStorage.setItem('eva-reservations',JSON.stringify(remaining));
    else window.localStorage.removeItem('eva-reservations');

    const legacyRaw=window.localStorage.getItem('eva-reservation');
    if(legacyRaw){
      try{
        const legacy=JSON.parse(legacyRaw) as StoredReservation;
        if(legacy.unitId===unitId&&legacy.token){
          await fetch(`${apiBase}/api/v1/reservations/${encodeURIComponent(legacy.token)}/release`,{method:'POST'}).catch(()=>undefined);
          window.localStorage.removeItem('eva-reservation');
        }
      }catch{window.localStorage.removeItem('eva-reservation');}
    }
  }

  async function removeItem(unitId:string){
    await releaseReservationFor(unitId);
    setItems(current=>{
      const next=current.filter(item=>item.unitId!==unitId);
      writeCart(next);
      if(!next.length){
        window.localStorage.removeItem('eva-gift-order');
        setGift(emptyGift);
      }
      return next;
    });
  }

  async function saveForLater(item:CartItem){
    setSavedItems(current=>{
      const next=current.some(saved=>saved.unitId===item.unitId)?current:[...current,item];
      writeSavedLater(next);
      return next;
    });
    await removeItem(item.unitId);
  }

  function restoreSavedItem(item:CartItem){
    setItems(current=>{
      const next=current.some(cartItem=>cartItem.unitId===item.unitId)?current:[...current,item];
      writeCart(next);
      return next;
    });
    setSavedItems(current=>{
      const next=current.filter(saved=>saved.unitId!==item.unitId);
      writeSavedLater(next);
      return next;
    });
  }

  function removeSavedItem(unitId:string){
    setSavedItems(current=>{
      const next=current.filter(item=>item.unitId!==unitId);
      writeSavedLater(next);
      return next;
    });
  }

  if(!ready)return <main className={styles.page}><div className={styles.loading}>در حال آماده‌کردن سبد خرید...</div></main>;

  if(items.length===0&&savedItems.length===0){
    return <main className={styles.page}>
      <section className={styles.empty}>
        <span>YOUR CART</span>
        <h1>سبد خریدت خالیه.</h1>
        <p>قطعه‌های موجود ایوا را ببین و انتخابت را از فروشگاه شروع کن.</p>
        <div className={styles.emptyActions}><Link className={styles.primaryButton} href="/shop">مشاهده فروشگاه</Link><Link href="/wishlist">علاقه‌مندی‌ها</Link></div>
      </section>
    </main>;
  }

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><span>سبد خرید</span></div>

    <section className={styles.intro}>
      <div><span>YOUR CART</span><h1>سبد خرید</h1></div>
      <Link href="/shop">ادامه خرید <span>←</span></Link>
    </section>

    <section className={styles.cartWrap}>
      <div className={styles.cartMain}>
        <div className={styles.listHead}><span>قطعه‌های انتخاب‌شده</span><b>{new Intl.NumberFormat('fa-IR').format(items.length)} قطعه</b></div>

        {items.length>0?<div className={styles.itemsList}>{items.map(item=><article className={styles.itemCard} key={item.unitId}>
          <Link href={item.slug?`/products/${item.slug}`:'/shop'} className={styles.media} aria-label={item.name}>
            {item.imageUrl?<img src={item.imageUrl} alt={item.name} decoding="async"/>:<div className={styles.visual} aria-hidden="true"><span className={styles.chain}/><span className={styles.jewel}/></div>}
          </Link>

          <div className={styles.itemInfo}>
            <div className={styles.itemTop}>
              <div><span className={styles.collection}>{item.collection}</span><h2>{item.name}</h2><p>{item.weight}<i/> {item.purity}</p></div>
              <div className={styles.itemPrice}><strong>{toman(item.price)}</strong><span>تومان</span></div>
            </div>
            <div className={styles.sku}><span>کد قطعه</span><b dir="ltr">{item.unitSku??item.unitId}</b></div>
            <div className={styles.itemActions}>
              <button type="button" className={styles.saveAction} onClick={()=>saveForLater(item)}><span aria-hidden="true">♡</span> ذخیره برای بعد</button>
              <button type="button" className={styles.removeAction} onClick={()=>removeItem(item.unitId)}><span aria-hidden="true">×</span> حذف از سبد</button>
            </div>
          </div>
        </article>)}</div>:<div className={styles.cartEmptyInline}>فعلاً قطعه‌ای در سبد خرید نیست.</div>}

        {items.length>0&&<div className={styles.priceNote}><span aria-hidden="true">◎</span><div><strong>هر وزن یک قطعه فیزیکی مستقل است.</strong><p>می‌توانی چند وزن متفاوت از یک مدل را همزمان سفارش بدهی. در Checkout همه Unitهای این سبد با هم برای ۱۰ دقیقه رزرو و قیمت هرکدام جداگانه قفل می‌شود.</p></div></div>}

        {savedItems.length>0&&<section className={styles.savedSection}>
          <div className={styles.savedHead}><div><span>SAVED FOR LATER</span><h2>ذخیره‌شده برای بعد</h2></div><b>{new Intl.NumberFormat('fa-IR').format(savedItems.length)} قطعه</b></div>
          <div className={styles.savedList}>{savedItems.map(item=><article className={styles.savedCard} key={item.unitId}>
            <Link href={item.slug?`/products/${item.slug}`:'/shop'} className={styles.savedMedia} aria-label={item.name}>
              {item.imageUrl?<img src={item.imageUrl} alt={item.name} decoding="async"/>:<div className={styles.visual} aria-hidden="true"><span className={styles.chain}/><span className={styles.jewel}/></div>}
            </Link>
            <div className={styles.savedInfo}>
              <span>{item.collection}</span><h3>{item.name}</h3><p>{item.weight} · {item.purity}</p>
              <div className={styles.savedPrice}>{toman(item.price)} <small>تومان</small></div>
              <div className={styles.savedActions}><button type="button" onClick={()=>restoreSavedItem(item)}>بازگرداندن به سبد</button><button type="button" onClick={()=>removeSavedItem(item.unitId)}>حذف</button></div>
            </div>
          </article>)}</div>
        </section>}

        {items.length>0&&<section className={styles.giftBlock}>
          <label className={styles.giftOption}>
            <input type="checkbox" checked={gift.enabled} onChange={event=>setGift(current=>({...current,enabled:event.target.checked}))}/>
            <span className={styles.checkmark} aria-hidden="true"/>
            <div><strong>این سفارش هدیه است</strong><span>پیام هدیه و عدم نمایش قیمت داخل بسته</span></div>
          </label>
          {gift.enabled&&<div className={styles.giftPanel}>
            <label><span>پیام هدیه</span><textarea value={gift.message} maxLength={220} onChange={event=>setGift(current=>({...current,message:event.target.value}))} placeholder="یک پیام کوتاه برای گیرنده..."/><small>{new Intl.NumberFormat('fa-IR').format(gift.message.length)} / ۲۲۰</small></label>
            <label className={styles.hidePrice}><input type="checkbox" checked={gift.hidePrice} onChange={event=>setGift(current=>({...current,hidePrice:event.target.checked}))}/><span>قیمت داخل بسته نمایش داده نشود</span></label>
          </div>}
        </section>}
      </div>

      {items.length>0?<aside className={styles.summary}>
        <div className={styles.summaryHead}><span>ORDER SUMMARY</span><h2>خلاصه سفارش</h2></div>
        <div className={styles.summaryRows}>
          <div><span>تعداد قطعات</span><strong>{new Intl.NumberFormat('fa-IR').format(items.length)}</strong></div>
          <div><span>جمع محصولات</span><strong>{toman(total)} <small>تومان</small></strong></div>
          <div><span>ارسال</span><strong>مرحله بعد</strong></div>
          {gift.enabled&&<div><span>سفارش هدیه</span><strong>فعال</strong></div>}
        </div>
        <div className={styles.total}><span>جمع فعلی</span><strong>{toman(total)} <small>تومان</small></strong></div>
        <Link href="/checkout" className={styles.checkoutButton}>ادامه و ثبت اطلاعات ارسال <span>←</span></Link>
        <div className={styles.trust}><span>وزن دقیق</span><span>فاکتور معتبر</span><span>پرداخت امن</span></div>
        <p>رزرو همه قطعات از زمان ورود به Checkout شروع می‌شود.</p>
      </aside>:<aside className={styles.savedOnlyAside}><span>SAVED ITEMS</span><h2>انتخابت محفوظ است.</h2><p>هر زمان خواستی یکی از قطعه‌های ذخیره‌شده را به سبد برگردان.</p><Link href="/shop">ادامه خرید</Link></aside>}
    </section>
  </main>;
}
