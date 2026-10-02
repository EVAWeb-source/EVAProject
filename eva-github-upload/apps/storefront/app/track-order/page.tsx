'use client';

import { FormEvent, useState } from 'react';
import styles from './track.module.css';

type Tracking = {
  number: string;
  status: string;
  fulfillmentStatus: 'REGISTERED'|'PREPARING'|'READY_TO_SHIP'|'SHIPPED'|'DELIVERED';
  createdAt: string;
  paidAt: string | null;
  item: { name:string; weightGram:string; purity:number } | null;
  shipping: { carrier:string|null; trackingCode:string|null; shippedAt:string|null; deliveredAt:string|null };
};

const flow=['REGISTERED','PREPARING','READY_TO_SHIP','SHIPPED','DELIVERED'] as const;
const labels:Record<(typeof flow)[number],string>={
  REGISTERED:'ثبت شد',PREPARING:'در حال آماده‌سازی',READY_TO_SHIP:'آماده ارسال',SHIPPED:'ارسال شد',DELIVERED:'تحویل شد'
};

function latinDigits(value:string){
  return value.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
function date(value:string|null){
  if(!value)return '—';
  return new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
}
function weight(value:string){
  return `${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;
}

export default function TrackOrderPage(){
  const [data,setData]=useState<Tracking|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError('');setData(null);
    const form=new FormData(event.currentTarget);
    const orderNumber=latinDigits(String(form.get('orderNumber')??'')).trim().toUpperCase();
    const mobile=latinDigits(String(form.get('mobile')??'')).replace(/\s/g,'');
    try{
      const response=await fetch('/api/tracking',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({orderNumber,mobile}),
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(typeof body?.message==='string'?body.message:'سفارش پیدا نشد.');
      setData(body);
    }catch(cause){
      setError(cause instanceof Error?cause.message:'رهگیری سفارش انجام نشد.');
    }finally{setBusy(false);}
  }

  const current=data?flow.indexOf(data.fulfillmentStatus):-1;

  return <main className={styles.page}>
    <header className={styles.header}><a className={styles.brand} href="/">EVA</a><a className={styles.back} href="/account">حساب کاربری</a></header>
    <div className={styles.wrap}>
      <section className={styles.intro}><span className={styles.eyebrow}>ORDER TRACKING</span><h1>رهگیری سفارش</h1><p>شماره سفارش و همان موبایلی که هنگام خرید وارد کردی را بنویس.</p></section>

      <form className={styles.form} onSubmit={submit}>
        <label>شماره سفارش<input name="orderNumber" placeholder="EVA-2026-123456" dir="ltr" required /></label>
        <label>شماره موبایل<input name="mobile" placeholder="0912..." inputMode="tel" dir="ltr" required /></label>
        <button disabled={busy}>{busy?'در حال بررسی...':'رهگیری سفارش'}</button>
      </form>
      {error&&<div className={styles.error}>{error}</div>}

      {data&&<article className={styles.card}>
        <div className={styles.head}><div><span className={styles.eyebrow}>ORDER</span><h2 dir="ltr">{data.number}</h2></div><span className={styles.status}>{labels[data.fulfillmentStatus]}</span></div>
        <div className={styles.progress}>{flow.map((step,index)=><div key={step} className={index<=current?styles.done:styles.step}><i>{index+1}</i><span>{labels[step]}</span></div>)}</div>
        <div className={styles.grid}>
          <div><span>محصول</span><strong>{data.item?.name??'—'}</strong></div>
          <div><span>وزن و عیار</span><strong>{data.item?`${weight(data.item.weightGram)} • ${data.item.purity} عیار`:'—'}</strong></div>
          <div><span>ثبت سفارش</span><strong>{date(data.createdAt)}</strong></div>
          <div><span>پرداخت</span><strong>{data.status==='PAID'?'تأیید شده':data.status}</strong></div>
        </div>
        <div className={styles.shipping}>
          <div><span>روش ارسال</span><strong>{data.shipping.carrier??'—'}</strong></div>
          <div><span>کد رهگیری</span><strong dir="ltr">{data.shipping.trackingCode??'—'}</strong></div>
          <div><span>ارسال</span><strong>{date(data.shipping.shippedAt)}</strong></div>
          <div><span>تحویل</span><strong>{date(data.shipping.deliveredAt)}</strong></div>
        </div>
      </article>}
    </div>  </main>;
}
