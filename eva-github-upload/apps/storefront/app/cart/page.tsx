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

const apiBase=process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';
const emptyGift:GiftState={enabled:false,message:'',hidePrice:true};

function toman(value:number){return new Intl.NumberFormat('fa-IR').format(value);}

export default function CartPage(){
  const [item,setItem]=useState<CartItem|null>(null);
  const [gift,setGift]=useState<GiftState>(emptyGift);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    try{
      const raw=window.localStorage.getItem('eva-cart');
      if(raw){
        const parsed=JSON.parse(raw) as CartItem;
        if(parsed?.unitId&&parsed?.name)setItem(parsed);
        else window.localStorage.removeItem('eva-cart');
      }
    }catch{window.localStorage.removeItem('eva-cart');}

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

  const total=useMemo(()=>item?.price??0,[item]);

  async function releaseReservation(){
    const reservationRaw=window.localStorage.getItem('eva-reservation');
    if(!reservationRaw)return;
    try{
      const reservation=JSON.parse(reservationRaw) as {token?:string};
      if(reservation.token)await fetch(`${apiBase}/api/v1/reservations/${reservation.token}/release`,{method:'POST'}).catch(()=>undefined);
    }catch{}
    window.localStorage.removeItem('eva-reservation');
  }

  async function removeItem(){
    await releaseReservation();
    window.localStorage.removeItem('eva-cart');
    window.localStorage.removeItem('eva-gift-order');
    setItem(null);
    setGift(emptyGift);
    window.dispatchEvent(new Event('eva-cart-change'));
  }

  async function saveForLater(){
    if(!item)return;
    try{
      const current:string[]=JSON.parse(window.localStorage.getItem('eva-wishlist')??'[]');
      if(item.slug&&!current.includes(item.slug)){
        window.localStorage.setItem('eva-wishlist',JSON.stringify([...current,item.slug]));
        window.dispatchEvent(new Event('eva-wishlist-change'));
      }
    }catch{}
    await removeItem();
  }

  if(!ready)return <main className={styles.page}><div className={styles.loading}>در حال آماده‌کردن سبد خرید...</div></main>;

  if(!item){
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
        <div className={styles.listHead}><span>قطعه انتخاب‌شده</span><b>۱ قطعه</b></div>

        <article className={styles.itemCard}>
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
              {item.slug&&<button type="button" className={styles.saveAction} onClick={saveForLater}><span aria-hidden="true">♡</span> ذخیره برای بعد</button>}
              <button type="button" className={styles.removeAction} onClick={removeItem}><span aria-hidden="true">×</span> حذف از سبد</button>
            </div>
          </div>
        </article>

        <div className={styles.priceNote}><span aria-hidden="true">◎</span><div><strong>قیمت نهایی در Checkout دوباره تأیید می‌شود.</strong><p>با ورود به مرحله بعد، همین Unit برای مدت محدود رزرو و قیمت همان قطعه روی سفارش قفل می‌شود.</p></div></div>

        <section className={styles.giftBlock}>
          <label className={styles.giftOption}>
            <input type="checkbox" checked={gift.enabled} onChange={event=>setGift(current=>({...current,enabled:event.target.checked}))}/>
            <span className={styles.checkmark} aria-hidden="true"/>
            <div><strong>این سفارش هدیه است</strong><span>پیام هدیه و عدم نمایش قیمت داخل بسته</span></div>
          </label>
          {gift.enabled&&<div className={styles.giftPanel}>
            <label><span>پیام هدیه</span><textarea value={gift.message} maxLength={220} onChange={event=>setGift(current=>({...current,message:event.target.value}))} placeholder="یک پیام کوتاه برای گیرنده..."/><small>{new Intl.NumberFormat('fa-IR').format(gift.message.length)} / ۲۲۰</small></label>
            <label className={styles.hidePrice}><input type="checkbox" checked={gift.hidePrice} onChange={event=>setGift(current=>({...current,hidePrice:event.target.checked}))}/><span>قیمت داخل بسته نمایش داده نشود</span></label>
          </div>}
        </section>
      </div>

      <aside className={styles.summary}>
        <div className={styles.summaryHead}><span>ORDER SUMMARY</span><h2>خلاصه سفارش</h2></div>
        <div className={styles.summaryRows}>
          <div><span>قیمت قطعه</span><strong>{toman(item.price)} <small>تومان</small></strong></div>
          <div><span>ارسال</span><strong>مرحله بعد</strong></div>
          {gift.enabled&&<div><span>بسته‌بندی هدیه</span><strong>بدون هزینه</strong></div>}
        </div>
        <div className={styles.total}><span>جمع فعلی</span><strong>{toman(total)} <small>تومان</small></strong></div>
        <Link href="/checkout" className={styles.checkoutButton}>ادامه و ثبت اطلاعات ارسال <span>←</span></Link>
        <div className={styles.trust}><span>وزن دقیق</span><span>فاکتور معتبر</span><span>پرداخت امن</span></div>
        <p>رزرو این قطعه از زمان ورود به Checkout شروع می‌شود.</p>
      </aside>
    </section>
  </main>;
}
