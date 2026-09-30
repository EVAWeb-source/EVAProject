'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './payment.module.css';

type Payment = {
  token:string;
  provider:string;
  status:string;
  amountToman:number;
  referenceId:string|null;
  failureCode:string|null;
  paidAt:string|null;
  invoice:{invoiceNumber:string;verificationCode:string}|null;
  order:{
    number:string;
    status:string;
    totalToman:number;
    customerName:string;
    item:{name:string;unitSku:string;weightGram:string;purity:number;priceToman:number}|null;
  };
  reservation:{status:string;expiresAt:string;remainingSeconds:number}|null;
};

const apiBase=process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';

function toman(value:number){return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;}
function faWeight(value:string){return `${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;}

export default function DemoPaymentPage(){
  const [payment,setPayment]=useState<Payment|null>(null);
  const [loading,setLoading]=useState(true);
  const [acting,setActing]=useState(false);
  const [error,setError]=useState('');
  const [secondsLeft,setSecondsLeft]=useState(0);

  useEffect(()=>{
    const token=new URLSearchParams(window.location.search).get('token');
    if(!token){setError('توکن پرداخت پیدا نشد.');setLoading(false);return;}

    let cancelled=false;
    async function load(){
      try{
        const response=await fetch(`${apiBase}/api/v1/payments/demo/${encodeURIComponent(token!)}`,{cache:'no-store'});
        if(!response.ok)throw new Error(await response.text());
        const data:Payment=await response.json();
        if(cancelled)return;
        setPayment(data);
        setSecondsLeft(data.reservation?.remainingSeconds ?? 0);
      }catch(err){
        console.error(err);
        if(!cancelled)setError('اطلاعات پرداخت بارگذاری نشد.');
      }finally{
        if(!cancelled)setLoading(false);
      }
    }
    void load();
    return()=>{cancelled=true;};
  },[]);

  useEffect(()=>{
    if(!payment?.reservation || payment.status!=='INITIATED')return;
    const tick=()=>setSecondsLeft(Math.max(0,Math.floor((new Date(payment.reservation!.expiresAt).getTime()-Date.now())/1000)));
    tick();
    const timer=window.setInterval(tick,1000);
    return()=>window.clearInterval(timer);
  },[payment?.token,payment?.status]);

  const clock=useMemo(()=>{
    const m=Math.floor(secondsLeft/60);
    const s=secondsLeft%60;
    return `${new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false}).format(m)}:${new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false}).format(s)}`;
  },[secondsLeft]);

  async function finish(kind:'success'|'fail'){
    if(!payment || acting)return;
    setActing(true);
    setError('');
    try{
      const response=await fetch(`${apiBase}/api/v1/payments/demo/${encodeURIComponent(payment.token)}/${kind}`,{method:'POST'});
      if(!response.ok)throw new Error(await response.text());
      const data:Payment=await response.json();
      setPayment(data);

      if(kind==='success' && data.status==='SUCCEEDED'){
        const item=data.order.item;
        window.localStorage.setItem('eva-last-order',JSON.stringify({
          number:data.order.number,
          name:item?.name ?? 'سفارش EVA',
          weight:item ? faWeight(item.weightGram) : '',
          price:data.order.totalToman,
          status:'پرداخت شد',
          referenceId:data.referenceId,
          invoiceNumber:data.invoice?.invoiceNumber ?? null,
          verificationCode:data.invoice?.verificationCode ?? null,
        }));
        window.localStorage.removeItem('eva-cart');
        window.localStorage.removeItem('eva-reservation');
        window.localStorage.removeItem('eva-pending-order');
        window.location.href=`/success?order=${encodeURIComponent(data.order.number)}`;
        return;
      }

      if(kind==='fail'){
        window.localStorage.removeItem('eva-reservation');
        window.localStorage.removeItem('eva-pending-order');
      }
    }catch(err){
      console.error(err);
      setError('عملیات پرداخت انجام نشد. ممکن است زمان رزرو تمام شده باشد.');
    }finally{
      setActing(false);
    }
  }

  if(loading)return <main className={styles.page}><div className={styles.card}><div className={styles.brand}>EVA</div><p>در حال اتصال به درگاه آزمایشی...</p></div></main>;
  if(error && !payment)return <main className={styles.page}><div className={styles.card}><div className={styles.brand}>EVA</div><h1>خطا در پرداخت</h1><p>{error}</p><a className={styles.secondary} href="/checkout">بازگشت به پرداخت</a></div></main>;
  if(!payment)return null;

  const active=payment.status==='INITIATED' && secondsLeft>0;
  const failed=payment.status==='FAILED' || payment.status==='EXPIRED' || payment.order.status==='CANCELLED';

  return <main className={styles.page}>
    <section className={styles.card}>
      <div className={styles.top}><div className={styles.brand}>EVA</div><span>DEMO PAYMENT GATEWAY</span></div>
      <div className={styles.notice}>این صفحه شبیه‌ساز درگاه است و هیچ تراکنش بانکی واقعی انجام نمی‌دهد.</div>

      <div className={styles.amount}><span>مبلغ پرداخت</span><strong>{toman(payment.amountToman)}</strong></div>

      <div className={styles.rows}>
        <div><span>شماره سفارش</span><strong dir="ltr">{payment.order.number}</strong></div>
        <div><span>محصول</span><strong>{payment.order.item?.name ?? '—'}</strong></div>
        <div><span>وزن</span><strong>{payment.order.item ? faWeight(payment.order.item.weightGram) : '—'}</strong></div>
        <div><span>وضعیت سفارش</span><strong>{payment.order.status}</strong></div>
      </div>

      {active&&<div className={styles.timer}><span>زمان باقی‌مانده رزرو</span><strong>{clock}</strong></div>}

      {payment.status==='SUCCEEDED'&&<div className={styles.successBox}><strong>✓ پرداخت آزمایشی موفق است</strong><span>کد مرجع: {payment.referenceId}</span>{payment.invoice&&<span>فاکتور: {payment.invoice.invoiceNumber}</span>}</div>}
      {failed&&<div className={styles.failBox}><strong>پرداخت ناموفق/منقضی شده</strong><span>قطعه از رزرو خارج شده و دوباره قابل خرید است.</span></div>}
      {error&&<p className={styles.error}>{error}</p>}

      {active&&<div className={styles.actions}>
        <button className={styles.success} disabled={acting} onClick={()=>finish('success')}>{acting?'در حال بررسی...':'✓ شبیه‌سازی پرداخت موفق'}</button>
        <button className={styles.fail} disabled={acting} onClick={()=>finish('fail')}>شبیه‌سازی پرداخت ناموفق</button>
      </div>}

      {failed&&<div className={styles.actions}><a className={styles.secondary} href="/checkout">تلاش دوباره از Checkout</a><a className={styles.textLink} href="/products/tolou">بازگشت به محصول</a></div>}
      {payment.status==='SUCCEEDED'&&<div className={styles.actions}>{payment.invoice&&<a className={styles.secondary} href={`/invoice/${encodeURIComponent(payment.invoice.invoiceNumber)}`}>مشاهده فاکتور</a>}<a className={styles.textLink} href={`/success?order=${encodeURIComponent(payment.order.number)}`}>مشاهده نتیجه سفارش</a></div>}
    </section>
  </main>;
}
