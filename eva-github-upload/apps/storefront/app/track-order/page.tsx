'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import styles from './track.module.css';

type TrackingItem = { name:string; unitSku?:string; weightGram:string; purity:number };
type Tracking = {
  number: string;
  status: string;
  fulfillmentStatus: 'REGISTERED'|'PREPARING'|'READY_TO_SHIP'|'SHIPPED'|'DELIVERED';
  createdAt: string;
  paidAt: string | null;
  items?: TrackingItem[];
  item: TrackingItem | null;
  shipping: { carrier:string|null; trackingCode:string|null; shippedAt:string|null; deliveredAt:string|null };
};

const flow=['REGISTERED','PREPARING','READY_TO_SHIP','SHIPPED','DELIVERED'] as const;
const labels:Record<(typeof flow)[number],string>={
  REGISTERED:'ثبت شد',PREPARING:'در حال آماده‌سازی',READY_TO_SHIP:'آماده ارسال',SHIPPED:'ارسال شد',DELIVERED:'تحویل شد'
};
const orderLabels:Record<string,string>={
  DEMO_CONFIRMED:'تأیید آزمایشی',PAID:'پرداخت‌شده',PENDING_PAYMENT:'در انتظار پرداخت',CANCELLED:'لغوشده',REFUND_PENDING:'در انتظار بازپرداخت',REFUNDED:'بازپرداخت‌شده'
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
        method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({orderNumber,mobile}),
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(typeof body?.message==='string'?body.message:'سفارش پیدا نشد.');
      setData(body);
    }catch(cause){
      setError(cause instanceof Error?cause.message:'رهگیری سفارش انجام نشد.');
    }finally{setBusy(false);}
  }

  const current=data?flow.indexOf(data.fulfillmentStatus):-1;
  const items=data?(data.items?.length?data.items:data.item?[data.item]:[]):[];

  return <main className={styles.page}>
    <section className={styles.hero}>
      <div>
        <span className={styles.eyebrow}>ORDER TRACKING</span>
        <h1>رهگیری سفارش</h1>
        <p>با شماره سفارش و همان موبایلی که هنگام خرید ثبت شده، مسیر سفارش را از ثبت تا تحویل ببین.</p>
      </div>
      <aside>
        <span>MY EVA</span>
        <strong>همه سفارش‌ها یک‌جا</strong>
        <Link href="/account">ورود به حساب کاربری ←</Link>
      </aside>
    </section>

    <section className={styles.trackPanel}>
      <div className={styles.panelIntro}><span>FIND YOUR ORDER</span><h2>اطلاعات سفارش را وارد کن</h2></div>
      <form className={styles.form} onSubmit={submit}>
        <label><span>شماره سفارش</span><input name="orderNumber" placeholder="EVA-2026-123456" dir="ltr" required /></label>
        <label><span>شماره موبایل</span><input name="mobile" placeholder="0912..." inputMode="tel" dir="ltr" required /></label>
        <button disabled={busy}>{busy?'در حال بررسی...':'رهگیری سفارش'}</button>
      </form>
      {error&&<div className={styles.error}>{error}</div>}
    </section>

    {data&&<article className={styles.card}>
      <header className={styles.head}>
        <div><span className={styles.eyebrow}>ORDER</span><h2 dir="ltr">{data.number}</h2><small>{date(data.createdAt)}</small></div>
        <div className={styles.badges}><span className={styles.orderState}>{orderLabels[data.status]??data.status}</span><span className={styles.status}>{labels[data.fulfillmentStatus]}</span></div>
      </header>

      <div className={styles.progressWrap}><div className={styles.progress}>{flow.map((step,index)=><div key={step} className={index<=current?styles.done:styles.step}><i>{index<current?'✓':index+1}</i><span>{labels[step]}</span></div>)}</div></div>

      <div className={styles.contentGrid}>
        <section className={styles.itemsBlock}>
          <div className={styles.blockHead}><span>قطعات سفارش</span><b>{new Intl.NumberFormat('fa-IR').format(items.length)} قطعه</b></div>
          <div className={styles.items}>{items.map((item,index)=><div className={styles.item} key={item.unitSku??`${item.name}-${index}`}>
            <div><strong>{item.name}</strong><span>{weight(item.weightGram)} · {new Intl.NumberFormat('fa-IR').format(item.purity)} عیار</span></div>
            <small dir="ltr">{item.unitSku??'—'}</small>
          </div>)}</div>
        </section>

        <aside className={styles.orderMeta}>
          <div><span>ثبت سفارش</span><strong>{date(data.createdAt)}</strong></div>
          <div><span>پرداخت</span><strong>{date(data.paidAt)}</strong></div>
          <div><span>وضعیت</span><strong>{orderLabels[data.status]??data.status}</strong></div>
        </aside>
      </div>

      <div className={styles.shipping}>
        <div><span>روش ارسال</span><strong>{data.shipping.carrier??'—'}</strong></div>
        <div><span>کد رهگیری</span><strong dir="ltr">{data.shipping.trackingCode??'—'}</strong></div>
        <div><span>زمان ارسال</span><strong>{date(data.shipping.shippedAt)}</strong></div>
        <div><span>تحویل</span><strong>{date(data.shipping.deliveredAt)}</strong></div>
      </div>
    </article>}

    <nav className={styles.quickLinks} aria-label="راهنمای سفارش">
      <Link href="/shipping-returns"><span>SHIPPING</span><strong>ارسال و مرجوعی</strong></Link>
      <Link href="/faq"><span>FAQ</span><strong>سوالات متداول</strong></Link>
      <Link href="/contact"><span>SUPPORT</span><strong>تماس با ایوا</strong></Link>
    </nav>
  </main>;
}
