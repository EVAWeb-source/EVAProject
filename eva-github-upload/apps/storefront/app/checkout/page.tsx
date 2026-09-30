'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import styles from './checkout.module.css';

type CartItem = { name:string; weight:string; purity:string; price:number; unitId:string; unitSku?:string };
type ApiOrder = {
  number:string;
  status:string;
  isDemo:boolean;
  totalToman:number;
  item:{ name:string; unitSku:string; weightGram:string; purity:number; priceToman:number } | null;
};
type ApiReservation = {
  token:string;
  status:string;
  expiresAt:string;
  remainingSeconds:number;
  unit:{ id:string; unitSku:string; exactWeightGram:string; priceToman:number|null; purity:number; productNameFa:string };
};
type ApiPayment = { token:string; status:string; amountToman:number; order:{ number:string; status:string } };
type StoredReservation = { token:string; unitId:string; expiresAt:string };

const apiBase=process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';

function toman(value:number){return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;}
function faWeight(value:string){return `${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;}

export default function CheckoutPage(){
  const [item,setItem]=useState<CartItem|null>(null);
  const [reservation,setReservation]=useState<ApiReservation|null>(null);
  const [reserving,setReserving]=useState(true);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [secondsLeft,setSecondsLeft]=useState(0);

  useEffect(()=>{
    const raw=window.localStorage.getItem('eva-cart');
    if(!raw){setReserving(false);return;}

    let parsed:CartItem;
    try{parsed=JSON.parse(raw);setItem(parsed);}catch{window.localStorage.removeItem('eva-cart');setReserving(false);return;}

    let cancelled=false;

    async function loadReservation(){
      setReserving(true);
      setError('');

      try{
        const cachedRaw=window.localStorage.getItem('eva-reservation');
        if(cachedRaw){
          try{
            const cached:StoredReservation=JSON.parse(cachedRaw);
            if(cached.unitId===parsed.unitId){
              const existing=await fetch(`${apiBase}/api/v1/reservations/${cached.token}`,{cache:'no-store'});
              if(existing.ok){
                const data:ApiReservation=await existing.json();
                if(data.status==='ACTIVE' && data.remainingSeconds>0){
                  if(cancelled)return;
                  applyReservation(data,parsed);
                  return;
                }
              }
            }
          }catch{}
          window.localStorage.removeItem('eva-reservation');
        }

        const response=await fetch(`${apiBase}/api/v1/reservations`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({unitId:parsed.unitId}),
        });

        if(!response.ok){
          if(response.status===409){throw new Error('RESERVED');}
          throw new Error(await response.text());
        }

        const data:ApiReservation=await response.json();
        if(cancelled)return;
        applyReservation(data,parsed);
      }catch(err){
        console.error(err);
        if(cancelled)return;
        setError(err instanceof Error && err.message==='RESERVED'
          ? 'این قطعه همین حالا توسط مشتری دیگری رزرو شده یا دیگر موجود نیست. لطفاً به فروشگاه برگرد و قطعه دیگری انتخاب کن.'
          : 'رزرو قطعه انجام نشد. لطفاً دوباره تلاش کن.');
      }finally{
        if(!cancelled)setReserving(false);
      }
    }

    function applyReservation(data:ApiReservation,current:CartItem){
      setReservation(data);
      setSecondsLeft(data.remainingSeconds);
      const refreshed={
        ...current,
        price:data.unit.priceToman ?? current.price,
        weight:faWeight(data.unit.exactWeightGram),
        unitSku:data.unit.unitSku,
        purity:`${data.unit.purity} عیار`,
        name:data.unit.productNameFa,
      };
      setItem(refreshed);
      window.localStorage.setItem('eva-cart',JSON.stringify(refreshed));
      window.localStorage.setItem('eva-reservation',JSON.stringify({token:data.token,unitId:data.unit.id,expiresAt:data.expiresAt}));
    }

    void loadReservation();
    return()=>{cancelled=true;};
  },[]);

  useEffect(()=>{
    if(!reservation)return;
    const tick=()=>{
      const left=Math.max(0,Math.floor((new Date(reservation.expiresAt).getTime()-Date.now())/1000));
      setSecondsLeft(left);
      if(left===0){
        setError('زمان رزرو این قطعه به پایان رسید. برای رزرو دوباره به صفحه محصول برگرد.');
        setReservation(null);
        window.localStorage.removeItem('eva-reservation');
      }
    };
    tick();
    const timer=window.setInterval(tick,1000);
    return()=>window.clearInterval(timer);
  },[reservation?.token]);

  const reservationClock=useMemo(()=>{
    const minutes=Math.floor(secondsLeft/60);
    const seconds=secondsLeft%60;
    return `${new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false}).format(minutes)}:${new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false}).format(seconds)}`;
  },[secondsLeft]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!item || !reservation || loading || secondsLeft<=0)return;

    setLoading(true);
    setError('');
    const form=new FormData(event.currentTarget);

    try{
      const orderResponse=await fetch(`${apiBase}/api/v1/orders`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          unitId:item.unitId,
          reservationToken:reservation.token,
          customerName:String(form.get('customerName')??''),
          mobile:String(form.get('mobile')??''),
          province:String(form.get('province')??''),
          city:String(form.get('city')??''),
          address:String(form.get('address')??''),
          postalCode:String(form.get('postalCode')??''),
          recipientName:String(form.get('recipientName')??''),
        }),
      });

      if(!orderResponse.ok){
        const body=await orderResponse.text();
        throw new Error(body || `HTTP ${orderResponse.status}`);
      }

      const saved:ApiOrder=await orderResponse.json();
      const paymentResponse=await fetch(`${apiBase}/api/v1/payments/demo/start/${encodeURIComponent(saved.number)}`,{method:'POST'});

      if(!paymentResponse.ok){
        const body=await paymentResponse.text();
        throw new Error(body || `PAYMENT HTTP ${paymentResponse.status}`);
      }

      const payment:ApiPayment=await paymentResponse.json();
      window.localStorage.setItem('eva-pending-order',JSON.stringify({
        number:saved.number,
        name:saved.item?.name ?? item.name,
        weight:saved.item ? faWeight(saved.item.weightGram) : item.weight,
        price:saved.totalToman,
        status:'در انتظار پرداخت',
      }));
      window.location.href=`/payment/demo?token=${encodeURIComponent(payment.token)}`;
    }catch(err){
      console.error(err);
      setError('ایجاد سفارش یا شروع پرداخت انجام نشد. ممکن است زمان رزرو تمام شده باشد؛ لطفاً دوباره تلاش کن.');
      setLoading(false);
    }
  }

  if(!item){
    return <main className={styles.empty}><a href="/" className={styles.brand}>EVA</a><h1>سبد خریدی برای پرداخت پیدا نشد.</h1><a href="/shop" className={styles.primary}>بازگشت به فروشگاه</a></main>;
  }

  return <main className={styles.page}>
    <header className={styles.header}><a href="/" className={styles.brand}>EVA</a><span>پرداخت امن</span></header>
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.intro}><span>CHECKOUT</span><h1>تکمیل سفارش</h1><p>از شروع این مرحله، قطعه انتخابی برای مدت محدودی فقط برای سفارش تو رزرو می‌شود.</p></div>

        <div className={styles.demoPay}>
          <strong>{reserving?'در حال رزرو قطعه...':reservation?`رزرو فعال • ${reservationClock}`:'رزرو فعال نیست'}</strong>
          <p>{reservation?'تا پایان این زمان، مشتری دیگری نمی‌تواند همین Unit را وارد Checkout کند.':'برای ادامه خرید باید رزرو معتبر داشته باشی.'}</p>
        </div>

        <section><h2><b>۱</b> اطلاعات تماس</h2><div className={styles.grid2}><label>نام و نام خانوادگی<input name="customerName" required placeholder="مثلاً حسین شاپوریان" /></label><label>شماره موبایل<input name="mobile" required inputMode="tel" placeholder="۰۹۱۲..." /></label></div></section>
        <section><h2><b>۲</b> آدرس ارسال</h2><div className={styles.grid2}><label>استان<input name="province" required placeholder="استان" /></label><label>شهر<input name="city" required placeholder="شهر" /></label></div><label>آدرس کامل<textarea name="address" required placeholder="خیابان، کوچه، پلاک و واحد" /></label><div className={styles.grid2}><label>کدپستی<input name="postalCode" required inputMode="numeric" placeholder="۱۰ رقم" /></label><label>نام گیرنده<input name="recipientName" required placeholder="نام گیرنده" /></label></div></section>
        <section><h2><b>۳</b> روش ارسال</h2><label className={styles.choice}><input type="radio" name="shipping" defaultChecked /><span><strong>ارسال استاندارد EVA</strong><small>هزینه و زمان دقیق در اتصال لجستیک واقعی محاسبه می‌شود.</small></span><b>فعلاً رایگان</b></label></section>
        <section><h2><b>۴</b> پرداخت</h2><div className={styles.demoPay}><strong>درگاه آزمایشی EVA</strong><p>با ادامه، سفارش با وضعیت «در انتظار پرداخت» ساخته می‌شود و به صفحه شبیه‌ساز درگاه می‌روی. هیچ پول واقعی جابه‌جا نمی‌شود.</p></div></section>
        {error&&<p role="alert" style={{color:'#8b2f2f',margin:'0 0 16px'}}>{error}</p>}
        <button className={styles.payButton} disabled={loading||reserving||!reservation||secondsLeft<=0}>{loading?'در حال انتقال به درگاه...':reserving?'در حال رزرو...':`ادامه به پرداخت آزمایشی • ${toman(item.price)}`}</button>
      </form>
      <aside className={styles.summary}><span>ORDER SUMMARY</span><h2>سفارش تو</h2><div className={styles.product}><div className={styles.visual}><i /><b /></div><div><strong>{item.name}</strong><small>{item.weight} • {item.purity}</small><small>کد قطعه: {item.unitSku ?? item.unitId}</small></div></div><div className={styles.rows}><div><span>محصول</span><strong>{toman(item.price)}</strong></div><div><span>ارسال</span><strong>رایگان</strong></div></div><div className={styles.total}><span>مبلغ نهایی</span><strong>{toman(item.price)}</strong></div><p>مبلغ پرداخت از Price Lock همان Reservation استفاده می‌کند و در سمت Backend تأیید می‌شود.</p></aside>
    </div>
  </main>;
}
