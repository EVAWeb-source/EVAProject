'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './OrderAfterSalesActions.module.css';

type CaseItem={id:string;type:string;status:string;reason:string;order:{id:string}};
type Data={items:CaseItem[]};
const labels:Record<string,string>={CANCELLATION:'لغو سفارش',RETURN:'مرجوعی',REQUESTED:'درخواست ثبت‌شده',RETURN_IN_TRANSIT:'در مسیر بازگشت',QC_PENDING:'در انتظار QC',REFUND_PENDING:'در انتظار بازپرداخت',COMPLETED:'تکمیل‌شده',REJECTED:'ردشده'};

async function post(path:string,payload:Record<string,unknown>){
  const response=await fetch('/api/admin/'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const raw=await response.text();
  if(!response.ok){
    try{const parsed=JSON.parse(raw);throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));}
    catch(error){if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;throw new Error(raw||`HTTP ${response.status}`);}
  }
  return raw?JSON.parse(raw):null;
}

export default function OrderAfterSalesActions({orderId,orderStatus,fulfillmentStatus}:{orderId:string;orderStatus:string;fulfillmentStatus:string}){
  const router=useRouter();
  const [current,setCurrent]=useState<CaseItem|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');

  useEffect(()=>{
    let cancelled=false;
    fetch('/api/admin/after-sales',{cache:'no-store'}).then(async response=>{
      if(!response.ok)return null;
      return response.json() as Promise<Data>;
    }).then(data=>{
      if(cancelled||!data)return;
      const found=data.items.find(item=>item.order.id===orderId&&item.status!=='REJECTED')??null;
      setCurrent(found);
    }).catch(()=>{});
    return()=>{cancelled=true;};
  },[orderId]);

  async function submit(event:FormEvent<HTMLFormElement>,type:'cancellation'|'return'){
    event.preventDefault();if(busy)return;
    setBusy(true);setError('');setMessage('');
    const data=new FormData(event.currentTarget);
    try{
      const created=await post(`orders/${orderId}/${type}`,{reason:data.get('reason'),note:data.get('note')});
      setCurrent(created);
      setMessage(type==='return'?'درخواست مرجوعی ثبت شد.':'درخواست لغو ثبت شد.');
      router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:'عملیات انجام نشد.');}
    finally{setBusy(false);}
  }

  const canCancel=orderStatus==='PENDING_PAYMENT'||(orderStatus==='PAID'&&!['SHIPPED','DELIVERED'].includes(fulfillmentStatus));
  const canReturn=orderStatus==='PAID'&&fulfillmentStatus==='DELIVERED';

  return <section className={styles.card}>
    <div className={styles.head}><div><span>AFTER SALES</span><h2>لغو و مرجوعی</h2></div><a href="/after-sales">مرکز After Sales</a></div>
    {message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}
    {current?<div className={styles.current}><div><span>{labels[current.type]??current.type}</span><strong>{labels[current.status]??current.status}</strong></div><p>{current.reason}</p><a href="/after-sales">مدیریت این پرونده ←</a></div>:
      canCancel?<form onSubmit={event=>submit(event,'cancellation')} className={styles.form}>
        <p>{orderStatus==='PENDING_PAYMENT'?'لغو این سفارش Reservation را آزاد می‌کند و Unit دوباره موجود می‌شود.':'لغو سفارش پرداخت‌شده ابتدا وارد مسیر تأیید و بازپرداخت می‌شود؛ هیچ Refund واقعی خودکار انجام نمی‌شود.'}</p>
        <label>دلیل لغو<input name="reason" required placeholder="مثلاً درخواست مشتری"/></label><label>یادداشت داخلی<textarea name="note" rows={2} placeholder="اختیاری"/></label>
        <button disabled={busy}>{busy?'در حال ثبت...':orderStatus==='PENDING_PAYMENT'?'لغو سفارش و آزادسازی Unit':'ثبت درخواست لغو'}</button>
      </form>:canReturn?<form onSubmit={event=>submit(event,'return')} className={styles.form}>
        <p>مرجوعی بعد از تحویل مستقیم به موجودی برنمی‌گردد؛ ابتدا دریافت می‌شود، سپس QC و بعد بازپرداخت انجام می‌شود.</p>
        <label>دلیل مرجوعی<input name="reason" required placeholder="دلیل درخواست مرجوعی"/></label><label>یادداشت داخلی<textarea name="note" rows={2} placeholder="اختیاری"/></label>
        <button disabled={busy}>{busy?'در حال ثبت...':'ثبت درخواست مرجوعی'}</button>
      </form>:<div className={styles.empty}>برای وضعیت فعلی این سفارش عملیات جدید لغو/مرجوعی قابل شروع نیست.</div>}
    <small className={styles.note}>Buyback مسیر جداگانه‌ای دارد و در این بخش ثبت نمی‌شود.</small>
  </section>;
}
