'use client';

import { FormEvent, useEffect, useState } from 'react';

type SmsItem = {
  id: string;
  orderNumber: string | null;
  mobile: string;
  event: string;
  body: string;
  provider: string;
  status: string;
  providerRef: string | null;
  error: string | null;
  createdAt: string;
  sentAt: string | null;
};

type SmsData = {
  generatedAt: string;
  summary: { pending: number; sent: number; failed: number; total: number };
  items: SmsItem[];
};

const eventLabels: Record<string,string> = {
  ORDER_PAID: 'پرداخت موفق',
  FULFILLMENT_PREPARING: 'شروع آماده‌سازی',
  FULFILLMENT_READY_TO_SHIP: 'آماده ارسال',
  FULFILLMENT_SHIPPED: 'ارسال شد',
  FULFILLMENT_DELIVERED: 'تحویل شد',
  ADMIN_TEST: 'پیام تست',
};

const statusLabels: Record<string,string> = {
  PENDING_PROVIDER: 'در انتظار اتصال سرویس',
  SENT: 'ارسال‌شده',
  FAILED: 'خطا',
};

function fa(value:number){ return new Intl.NumberFormat('fa-IR').format(value); }
function date(value:string|null){
  if(!value) return '—';
  return new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
}

export default function NotificationsPanel() {
  const [data,setData]=useState<SmsData|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');

  async function load(){
    setLoading(true);
    setError('');
    try{
      const response=await fetch('/api/admin/notifications',{cache:'no-store'});
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body?.message || body?.error || `HTTP ${response.status}`);
      setData(body);
    }catch(cause){
      setError(cause instanceof Error?cause.message:'دریافت Outbox انجام نشد.');
    }finally{setLoading(false);}
  }

  useEffect(()=>{ void load(); },[]);

  async function createTest(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    setBusy(true); setError(''); setMessage('');
    const form=event.currentTarget;
    const fd=new FormData(form);
    try{
      const response=await fetch('/api/admin/notifications/test',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          mobile: fd.get('mobile'),
          orderNumber: fd.get('orderNumber') || null,
        }),
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body?.message || body?.error || `HTTP ${response.status}`);
      setMessage('پیام تست در Outbox ثبت شد؛ هنوز هیچ SMS واقعی ارسال نشده است.');
      form.reset();
      await load();
    }catch(cause){
      setError(cause instanceof Error?cause.message:'ساخت پیام تست انجام نشد.');
    }finally{setBusy(false);}
  }

  return (
    <section id="notifications" className="panel notificationPanel">
      <div className="panelHead">
        <div><span>SMS OUTBOX</span><h2>پیامک‌های سفارش</h2></div>
        <small>فعلاً فقط صف پیام؛ Provider واقعی هنوز متصل نیست</small>
      </div>

      {(message||error)&&<div className={error?'actionMessage actionError':'actionMessage'}>{error||message}</div>}

      <div className="notificationSummary">
        <article><span>در انتظار Provider</span><b>{fa(data?.summary.pending ?? 0)}</b></article>
        <article><span>ارسال‌شده</span><b>{fa(data?.summary.sent ?? 0)}</b></article>
        <article><span>خطادار</span><b>{fa(data?.summary.failed ?? 0)}</b></article>
        <article><span>نمایش فعلی</span><b>{fa(data?.summary.total ?? 0)}</b></article>
      </div>

      <form className="notificationTestForm" onSubmit={createTest}>
        <div>
          <strong>ساخت پیام تست</strong>
          <small>این عملیات فقط یک رکورد در Outbox می‌سازد و پیام واقعی ارسال نمی‌کند.</small>
        </div>
        <label>شماره موبایل<input name="mobile" dir="ltr" required placeholder="0912..." /></label>
        <label>شماره سفارش (اختیاری)<input name="orderNumber" dir="ltr" placeholder="EVA-2026-123456" /></label>
        <button className="primaryButton" disabled={busy}>{busy?'در حال ثبت...':'ثبت پیام تست'}</button>
      </form>

      <div className="tableWrap">
        <table>
          <thead><tr><th>زمان</th><th>رویداد</th><th>سفارش</th><th>موبایل</th><th>متن پیام</th><th>Provider</th><th>وضعیت</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}>در حال دریافت Outbox...</td></tr>}
            {!loading && (data?.items.length ?? 0)===0 && <tr><td colSpan={7}>هنوز پیامی در Outbox ثبت نشده است.</td></tr>}
            {data?.items.map(item=><tr key={item.id}>
              <td>{date(item.createdAt)}</td>
              <td><strong>{eventLabels[item.event] ?? item.event}</strong></td>
              <td dir="ltr">{item.orderNumber ?? '—'}</td>
              <td dir="ltr">{item.mobile}</td>
              <td className="smsBody">{item.body}</td>
              <td dir="ltr">{item.provider}</td>
              <td><span className={`badge sms-${item.status.toLowerCase()}`}>{statusLabels[item.status] ?? item.status}</span>{item.error&&<small>{item.error}</small>}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
}
