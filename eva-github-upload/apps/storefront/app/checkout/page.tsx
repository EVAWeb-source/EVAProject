'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import styles from './checkout.module.css';

type CartItem={
  productId:string;unitId:string;unitSku?:string;name:string;collection?:string;
  weight:string;purity:string;price:number;imageUrl?:string;slug?:string;
};
type GiftState={enabled:boolean;message:string;hidePrice:boolean};
type ApiOrderItem={name:string;unitSku:string;weightGram:string;purity:number;priceToman:number};
type ApiOrder={number:string;status:string;isDemo:boolean;totalToman:number;items:ApiOrderItem[];item:ApiOrderItem|null};
type ApiReservation={
  token:string;status:string;expiresAt:string;remainingSeconds:number;
  unit:{id:string;unitSku:string;exactWeightGram:string;priceToman:number|null;purity:number;productNameFa:string};
};
type ApiReservationBatch={expiresAt:string;remainingSeconds:number;reservations:ApiReservation[]};
type ApiPayment={token:string;status:string;amountToman:number;order:{number:string;status:string}};
type StoredReservation={token:string;unitId:string;expiresAt:string};

const apiBase=process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';
const emptyGift:GiftState={enabled:false,message:'',hidePrice:true};

function toman(value:number){return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;}
function faWeight(value:string){return `${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;}
function readCart():CartItem[]{
  try{
    const raw=window.localStorage.getItem('eva-cart');
    if(!raw)return [];
    const value=JSON.parse(raw);
    const items=Array.isArray(value)?value:[value];
    return items.filter((item):item is CartItem=>Boolean(item&&typeof item==='object'&&item.unitId&&item.name));
  }catch{return [];}
}

export default function CheckoutPage(){
  const [items,setItems]=useState<CartItem[]>([]);
  const [gift,setGift]=useState<GiftState>(emptyGift);
  const [reservations,setReservations]=useState<ApiReservation[]>([]);
  const [reservationExpiry,setReservationExpiry]=useState('');
  const [reserving,setReserving]=useState(true);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [secondsLeft,setSecondsLeft]=useState(0);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    const current=readCart();
    setItems(current);
    if(!current.length){setReserving(false);setReady(true);return;}

    try{
      const giftRaw=window.localStorage.getItem('eva-gift-order');
      if(giftRaw)setGift({...emptyGift,...JSON.parse(giftRaw)});
    }catch{window.localStorage.removeItem('eva-gift-order');}

    let cancelled=false;

    async function releaseStored(stored:StoredReservation[]){
      await Promise.all(stored.map(item=>fetch(`${apiBase}/api/v1/reservations/${encodeURIComponent(item.token)}/release`,{method:'POST'}).catch(()=>undefined)));
      window.localStorage.removeItem('eva-reservations');
    }

    async function applyReservationData(data:ApiReservation[],currentItems:CartItem[]){
      const byUnit=new Map(data.map(reservation=>[reservation.unit.id,reservation]));
      const refreshed=currentItems.map(item=>{
        const reservation=byUnit.get(item.unitId);
        if(!reservation)return item;
        return {
          ...item,
          price:reservation.unit.priceToman??item.price,
          weight:faWeight(reservation.unit.exactWeightGram),
          unitSku:reservation.unit.unitSku,
          purity:`${reservation.unit.purity} عیار`,
          name:reservation.unit.productNameFa,
        };
      });
      const expiry=new Date(Math.min(...data.map(entry=>new Date(entry.expiresAt).getTime()))).toISOString();
      const remaining=Math.max(0,Math.floor((new Date(expiry).getTime()-Date.now())/1000));
      if(cancelled)return;
      setItems(refreshed);
      setReservations(data);
      setReservationExpiry(expiry);
      setSecondsLeft(remaining);
      window.localStorage.setItem('eva-cart',JSON.stringify(refreshed));
      window.localStorage.setItem('eva-reservations',JSON.stringify(data.map(entry=>({token:entry.token,unitId:entry.unit.id,expiresAt:entry.expiresAt}))));
      window.localStorage.removeItem('eva-reservation');
      window.dispatchEvent(new Event('eva-cart-change'));
    }

    async function loadReservations(){
      setReserving(true);
      setError('');
      try{
        let stored:StoredReservation[]=[];
        try{
          const raw=window.localStorage.getItem('eva-reservations');
          if(raw){
            const value=JSON.parse(raw);
            stored=Array.isArray(value)?value:[];
          }
        }catch{window.localStorage.removeItem('eva-reservations');}

        const currentIds=new Set(current.map(item=>item.unitId));
        const storedMatches=stored.length===current.length&&stored.every(item=>currentIds.has(item.unitId));
        if(storedMatches){
          const responses=await Promise.all(stored.map(item=>fetch(`${apiBase}/api/v1/reservations/${encodeURIComponent(item.token)}`,{cache:'no-store'})));
          if(responses.every(response=>response.ok)){
            const existing=await Promise.all(responses.map(response=>response.json() as Promise<ApiReservation>));
            if(existing.every(entry=>entry.status==='ACTIVE'&&entry.remainingSeconds>0&&currentIds.has(entry.unit.id))){
              await applyReservationData(existing,current);
              return;
            }
          }
          await releaseStored(stored);
        }else if(stored.length){
          await releaseStored(stored);
        }

        const legacyRaw=window.localStorage.getItem('eva-reservation');
        if(legacyRaw){
          try{
            const legacy=JSON.parse(legacyRaw) as StoredReservation;
            if(legacy.token)await fetch(`${apiBase}/api/v1/reservations/${encodeURIComponent(legacy.token)}/release`,{method:'POST'}).catch(()=>undefined);
          }catch{}
          window.localStorage.removeItem('eva-reservation');
        }

        const response=await fetch(`${apiBase}/api/v1/reservations/batch`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({unitIds:current.map(item=>item.unitId)}),
        });
        if(!response.ok){
          if(response.status===409)throw new Error('RESERVED');
          throw new Error(await response.text());
        }
        const batch:ApiReservationBatch=await response.json();
        await applyReservationData(batch.reservations,current);
      }catch(err){
        console.error(err);
        if(cancelled)return;
        setReservations([]);
        setReservationExpiry('');
        setSecondsLeft(0);
        setError(err instanceof Error&&err.message==='RESERVED'
          ? 'حداقل یکی از قطعه‌های سبد همین حالا توسط مشتری دیگری رزرو شده یا دیگر موجود نیست. به سبد برگرد و انتخابت را بررسی کن.'
          : 'رزرو قطعه‌های سفارش انجام نشد. لطفاً دوباره تلاش کن.');
      }finally{
        if(!cancelled){setReserving(false);setReady(true);}
      }
    }

    void loadReservations();
    return()=>{cancelled=true;};
  },[]);

  useEffect(()=>{
    if(!reservationExpiry||reservations.length===0)return;
    const tick=()=>{
      const left=Math.max(0,Math.floor((new Date(reservationExpiry).getTime()-Date.now())/1000));
      setSecondsLeft(left);
      if(left===0){
        setError('زمان رزرو سفارش به پایان رسید. قطعه‌ها از حالت رزرو خارج شدند؛ برای رزرو دوباره به سبد خرید برگرد.');
        setReservations([]);
        window.localStorage.removeItem('eva-reservations');
      }
    };
    tick();
    const timer=window.setInterval(tick,1000);
    return()=>window.clearInterval(timer);
  },[reservationExpiry,reservations.length]);

  const reservationClock=useMemo(()=>{
    const minutes=Math.floor(secondsLeft/60);
    const seconds=secondsLeft%60;
    return `${new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false}).format(minutes)}:${new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false}).format(seconds)}`;
  },[secondsLeft]);
  const total=useMemo(()=>items.reduce((sum,item)=>sum+Number(item.price||0),0),[items]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!items.length||reservations.length!==items.length||loading||secondsLeft<=0)return;

    setLoading(true);
    setError('');
    const form=new FormData(event.currentTarget);
    const reservationByUnit=new Map(reservations.map(entry=>[entry.unit.id,entry]));

    try{
      const orderResponse=await fetch(`${apiBase}/api/v1/orders`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          items:items.map(item=>({unitId:item.unitId,reservationToken:reservationByUnit.get(item.unitId)?.token})),
          customerName:String(form.get('customerName')??''),
          mobile:String(form.get('mobile')??''),
          province:String(form.get('province')??''),
          city:String(form.get('city')??''),
          address:String(form.get('address')??''),
          postalCode:String(form.get('postalCode')??''),
          recipientName:String(form.get('recipientName')??''),
          isGift:gift.enabled,
          giftMessage:gift.enabled?gift.message:'',
          hidePriceInPackage:gift.enabled?gift.hidePrice:false,
        }),
      });

      if(!orderResponse.ok)throw new Error(await orderResponse.text()||`HTTP ${orderResponse.status}`);
      const saved:ApiOrder=await orderResponse.json();
      const paymentResponse=await fetch(`${apiBase}/api/v1/payments/demo/start/${encodeURIComponent(saved.number)}`,{method:'POST'});
      if(!paymentResponse.ok)throw new Error(await paymentResponse.text()||`PAYMENT HTTP ${paymentResponse.status}`);

      const payment:ApiPayment=await paymentResponse.json();
      window.localStorage.setItem('eva-pending-order',JSON.stringify({
        number:saved.number,
        items:saved.items?.length?saved.items:items.map(item=>({name:item.name,weightGram:item.weight,priceToman:item.price})),
        price:saved.totalToman,
        status:'در انتظار پرداخت',
      }));
      window.location.href=`/payment/demo?token=${encodeURIComponent(payment.token)}`;
    }catch(err){
      console.error(err);
      setError('ایجاد سفارش یا شروع پرداخت انجام نشد. ممکن است زمان رزرو تمام شده باشد؛ لطفاً وضعیت سبد را دوباره بررسی کن.');
      setLoading(false);
    }
  }

  if(!ready&&items.length===0)return <main className={styles.page}><div className={styles.loading}>در حال آماده‌کردن Checkout...</div></main>;
  if(ready&&items.length===0){
    return <main className={styles.empty}><span>CHECKOUT</span><h1>سبدی برای پرداخت پیدا نشد.</h1><p>ابتدا قطعه‌های موردنظرت را به سبد خرید اضافه کن.</p><Link href="/shop" className={styles.primary}>بازگشت به فروشگاه</Link></main>;
  }

  const reservationReady=reservations.length===items.length&&items.length>0&&secondsLeft>0;

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/cart">سبد خرید</Link><span>/</span><strong>اطلاعات ارسال</strong><span>/</span><span>پرداخت</span></div>

    <div className={styles.layout}>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.intro}><span>CHECKOUT</span><h1>تکمیل سفارش</h1><p>اطلاعات ارسال را وارد کن. همه قطعه‌های سبد در این مرحله با قیمت ثبت‌شده برای مدت محدودی رزرو می‌شوند.</p></div>

        <div className={reservationReady?styles.reservation+' '+styles.reservationActive:styles.reservation}>
          <div><span className={styles.reserveDot}/><strong>{reserving?'در حال رزرو قطعه‌ها...':reservationReady?`${new Intl.NumberFormat('fa-IR').format(items.length)} قطعه برای تو رزرو شد`:'رزرو فعال نیست'}</strong></div>
          {reservationReady&&<b>{reservationClock}</b>}
          <p>{reservationReady?'تا پایان این زمان، Unitهای این سفارش برای مشتری دیگری قابل خرید نیستند.':'برای ادامه پرداخت باید رزرو همه قطعه‌ها فعال باشد.'}</p>
        </div>

        <section className={styles.formSection}><div className={styles.sectionHead}><b>۱</b><div><h2>اطلاعات تماس</h2><span>برای تأیید سفارش و پیگیری</span></div></div><div className={styles.grid2}><label>نام و نام خانوادگی<input name="customerName" autoComplete="name" required placeholder="نام و نام خانوادگی" /></label><label>شماره موبایل<input name="mobile" autoComplete="tel" required inputMode="tel" placeholder="۰۹۱۲..." /></label></div></section>

        <section className={styles.formSection}><div className={styles.sectionHead}><b>۲</b><div><h2>آدرس ارسال</h2><span>نشانی دقیق گیرنده سفارش</span></div></div><div className={styles.grid2}><label>استان<input name="province" autoComplete="address-level1" required placeholder="استان" /></label><label>شهر<input name="city" autoComplete="address-level2" required placeholder="شهر" /></label></div><label>آدرس کامل<textarea name="address" autoComplete="street-address" required placeholder="خیابان، کوچه، پلاک و واحد" /></label><div className={styles.grid2}><label>کدپستی<input name="postalCode" autoComplete="postal-code" required inputMode="numeric" placeholder="۱۰ رقم" /></label><label>نام گیرنده<input name="recipientName" required placeholder="نام گیرنده" /></label></div></section>

        <section className={styles.formSection}><div className={styles.sectionHead}><b>۳</b><div><h2>روش ارسال</h2><span>جزئیات نهایی با اتصال سرویس لجستیک تکمیل می‌شود</span></div></div><label className={styles.choice}><input type="radio" name="shipping" defaultChecked/><span><strong>ارسال استاندارد ایوا</strong><small>روش، هزینه و بازه تحویل در اتصال نهایی سرویس ارسال محاسبه خواهد شد.</small></span><b>انتخاب‌شده</b></label></section>

        <section className={styles.formSection}><div className={styles.sectionHead}><b>۴</b><div><h2>پرداخت</h2><span>نسخه فعلی برای تست جریان سفارش</span></div></div><div className={styles.demoPay}><strong>درگاه آزمایشی ایوا</strong><p>بعد از ثبت اطلاعات، Order واقعی تستی ساخته می‌شود و به شبیه‌ساز درگاه می‌روی. هیچ مبلغ بانکی واقعی جابه‌جا نمی‌شود.</p></div></section>

        {gift.enabled&&<div className={styles.giftSummary}><span>GIFT ORDER</span><strong>این سفارش به‌عنوان هدیه ثبت می‌شود.</strong>{gift.message&&<p>«{gift.message}»</p>}<small>{gift.hidePrice?'قیمت داخل بسته نمایش داده نمی‌شود.':'نمایش قیمت داخل بسته فعال است.'}</small></div>}
        {error&&<div className={styles.error} role="alert"><strong>امکان ادامه نیست</strong><p>{error}</p><Link href="/cart">بازگشت به سبد خرید</Link></div>}

        <button className={styles.payButton} disabled={loading||reserving||!reservationReady}>{loading?'در حال ساخت سفارش...':reserving?'در حال رزرو قطعه‌ها...':`ادامه به پرداخت آزمایشی • ${toman(total)}`}</button>
      </form>

      <aside className={styles.summary}>
        <div className={styles.summaryHead}><span>ORDER SUMMARY</span><h2>سفارش تو</h2><b>{new Intl.NumberFormat('fa-IR').format(items.length)} قطعه</b></div>
        <div className={styles.products}>{items.map(item=><article className={styles.product} key={item.unitId}>
          <Link href={item.slug?`/products/${item.slug}`:'/shop'} className={styles.productMedia}>{item.imageUrl?<img src={item.imageUrl} alt={item.name}/>:<div className={styles.visual}><i/><b/></div>}</Link>
          <div className={styles.productInfo}><strong>{item.name}</strong><small>{item.weight} • {item.purity}</small><small dir="ltr">{item.unitSku??item.unitId}</small><span>{toman(item.price)}</span></div>
        </article>)}</div>
        <div className={styles.rows}><div><span>جمع محصولات</span><strong>{toman(total)}</strong></div><div><span>ارسال</span><strong>در اتصال نهایی</strong></div>{gift.enabled&&<div><span>سفارش هدیه</span><strong>فعال</strong></div>}</div>
        <div className={styles.total}><span>مبلغ فعلی سفارش</span><strong>{toman(total)}</strong></div>
        <div className={styles.summaryTrust}><span>رزرو همزمان Unitها</span><span>قیمت قفل‌شده</span><span>فاکتور معتبر</span></div>
        <p>مبلغ نهایی پرداخت از قیمت قفل‌شده Reservationهای همین سفارش در Backend تأیید می‌شود.</p>
      </aside>
    </div>
  </main>;
}
