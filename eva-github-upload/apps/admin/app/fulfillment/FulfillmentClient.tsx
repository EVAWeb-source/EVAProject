'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminFilterMenu, { type AdminFilterOption } from '../components/AdminFilterMenu';
import styles from './fulfillment.module.css';

type FulfillmentStatus = 'REGISTERED' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED';
type OrderItem = { productNameFa: string; unitSku: string; exactWeightGram: string; unitPriceToman?: number };
type Order = {
  id:string;orderNumber:string;status:string;fulfillmentStatus:FulfillmentStatus;customerName:string;mobile:string;recipientName:string;province:string;city:string;address:string;postalCode:string;shippingCarrier:string|null;trackingCode:string|null;shippedAt:string|null;deliveredAt:string|null;totalToman:number;createdAt:string;itemCount:number;items:OrderItem[];item:OrderItem|null;payment:null|{referenceId:string|null;paidAt:string|null};invoiceNumber:string|null;
};

const labels:Record<FulfillmentStatus,string>={REGISTERED:'ثبت‌شده',PREPARING:'در حال آماده‌سازی',READY_TO_SHIP:'آماده ارسال',SHIPPED:'ارسال‌شده',DELIVERED:'تحویل‌شده'};
const flowOptions:AdminFilterOption[]=[
  {value:'ALL',label:'همه جریان‌ها'},
  {value:'ACTIVE',label:'همه سفارش‌های در جریان'},
  {value:'REGISTERED',label:'ثبت‌شده'},
  {value:'PREPARING',label:'در حال آماده‌سازی'},
  {value:'READY_TO_SHIP',label:'آماده ارسال'},
  {value:'SHIPPED',label:'ارسال‌شده'},
  {value:'DELIVERED',label:'تحویل‌شده'},
];
const nextStatus:Partial<Record<FulfillmentStatus,FulfillmentStatus>>={REGISTERED:'PREPARING',PREPARING:'READY_TO_SHIP',READY_TO_SHIP:'SHIPPED',SHIPPED:'DELIVERED'};
const actionLabel:Partial<Record<FulfillmentStatus,string>>={REGISTERED:'شروع آماده‌سازی',PREPARING:'آماده ارسال شد',READY_TO_SHIP:'ثبت ارسال',SHIPPED:'ثبت تحویل'};
const toman=(value:number)=>`${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
function date(value:string|null){if(!value)return'—';return new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}

export default function FulfillmentClient({orders,storefrontBase}:{orders:Order[];storefrontBase:string}){
  const router=useRouter();
  const inFlight=useRef<Set<string>>(new Set());
  const [busyId,setBusyId]=useState<string|null>(null);
  const [message,setMessage]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [shipping,setShipping]=useState<Record<string,{carrier:string;tracking:string}>>({});
  const [query,setQuery]=useState('');
  const [flow,setFlow]=useState('ACTIVE');

  const activeOrders=useMemo(()=>orders.filter(order=>order.fulfillmentStatus!=='DELIVERED'),[orders]);
  const filteredOrders=useMemo(()=>orders.filter(order=>{
    const q=query.trim().toLowerCase();
    const text=[order.orderNumber,order.customerName,order.mobile,order.recipientName,order.city,order.province,order.trackingCode].filter(Boolean).join(' ').toLowerCase();
    const matchesFlow=flow==='ALL'||(flow==='ACTIVE'?order.fulfillmentStatus!=='DELIVERED':order.fulfillmentStatus===flow);
    return matchesFlow&&(!q||text.includes(q));
  }),[orders,query,flow]);
  const filtersActive=Boolean(query)||flow!=='ACTIVE';

  async function advance(order:Order){
    if(inFlight.current.has(order.id))return;
    const target=nextStatus[order.fulfillmentStatus];if(!target)return;
    const shippingValue=shipping[order.id]??{carrier:'',tracking:''};
    if(target==='SHIPPED'&&(!shippingValue.carrier.trim()||!shippingValue.tracking.trim())){setError('برای ثبت ارسال، روش/شرکت ارسال و کد رهگیری را وارد کن.');return;}
    inFlight.current.add(order.id);setBusyId(order.id);setMessage(null);setError(null);
    try{
      const response=await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/fulfillment`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:target,...(target==='SHIPPED'?{shippingCarrier:shippingValue.carrier.trim(),trackingCode:shippingValue.tracking.trim()}: {})})});
      const payload=await response.json().catch(()=>({}));const detail=payload?.message??payload?.error??`خطای ${response.status}`;
      if(!response.ok){if(response.status===409&&String(detail).includes('one step at a time')){setMessage('وضعیت سفارش ثبت شده بود؛ اطلاعات تازه شد.');router.refresh();return;}throw new Error(detail);}
      setMessage(`وضعیت سفارش ${order.orderNumber} به «${labels[target]}» تغییر کرد.`);router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:'بروزرسانی وضعیت انجام نشد.');}
    finally{inFlight.current.delete(order.id);setBusyId(null);}
  }

  return <>
    {(message||error)&&<div className={`${styles.notice} ${error?styles.noticeError:''}`}>{error??message}</div>}

    <div className={styles.filterBar}>
      <div className={styles.filterTop}><div><strong>جریان سفارش‌ها</strong><small>مرحله عملیاتی سفارش یا شماره سفارش و مشتری را فیلتر کن.</small></div><div className={styles.filterMeta}><span>{new Intl.NumberFormat('fa-IR').format(filteredOrders.length)} سفارش</span>{filtersActive&&<button type="button" onClick={()=>{setQuery('');setFlow('ACTIVE');}}>پاک کردن</button>}</div></div>
      <div className={styles.filterGrid}>
        <label><span>جستجو</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="شماره سفارش، مشتری، موبایل یا کد رهگیری"/></label>
        <div className={styles.flowFilter}><AdminFilterMenu label="مرحله سفارش" value={flow} options={flowOptions} onChange={setFlow}/></div>
      </div>
    </div>

    <div className={styles.queueIntro}><strong>{new Intl.NumberFormat('fa-IR').format(activeOrders.length)} سفارش در جریان</strong><span>هر سفارش فقط یک مرحله به جلو می‌رود.</span></div>

    <div className={styles.orderList}>{filteredOrders.map(order=>{
      const target=nextStatus[order.fulfillmentStatus];
      const shipInput=shipping[order.id]??{carrier:order.shippingCarrier??'',tracking:order.trackingCode??''};
      const items=order.items?.length?order.items:order.item?[order.item]:[];
      return <article className={styles.orderCard} key={order.id}>
        <div className={styles.orderHead}><div><h2 dir="ltr">{order.orderNumber}</h2><small>{order.customerName} · {order.city}</small></div><span className={`${styles.fulfillmentBadge} ${styles[order.fulfillmentStatus.toLowerCase()]}`}>{labels[order.fulfillmentStatus]}</span></div>

        <div className={styles.progress} aria-label="مراحل آماده‌سازی و ارسال">{(['REGISTERED','PREPARING','READY_TO_SHIP','SHIPPED','DELIVERED'] as FulfillmentStatus[]).map((step,index)=>{const current=['REGISTERED','PREPARING','READY_TO_SHIP','SHIPPED','DELIVERED'].indexOf(order.fulfillmentStatus);return <div key={step} className={index<=current?styles.stepDone:styles.step}><i>{index+1}</i><span>{labels[step]}</span></div>;})}</div>

        <div className={styles.infoGrid}>
          <div><span>گیرنده</span><strong>{order.recipientName}</strong><small dir="ltr">{order.mobile}</small></div>
          <div><span>قطعات</span><strong>{new Intl.NumberFormat('fa-IR').format(items.length)} قطعه</strong><small>{items.map(item=>item.productNameFa).join('، ')}</small></div>
          <div><span>مبلغ</span><strong>{toman(order.totalToman)}</strong><small>پرداخت {date(order.payment?.paidAt??null)}</small></div>
          <div><span>مقصد</span><strong>{order.city}</strong><small>{order.province}</small></div>
        </div>

        <details className={styles.details}>
          <summary>جزئیات ارسال و قطعات</summary>
          <div className={styles.detailBody}>
            <div className={styles.addressBox}><span>آدرس</span><strong>{order.province}، {order.city}، {order.address}</strong><small>کدپستی: <b dir="ltr">{order.postalCode}</b></small></div>
            <div className={styles.itemList}>{items.map(item=><div key={item.unitSku}><strong>{item.productNameFa}</strong><span>{item.exactWeightGram} گرم</span><code dir="ltr">{item.unitSku}</code></div>)}</div>
          </div>
        </details>

        {(order.fulfillmentStatus==='READY_TO_SHIP'||order.fulfillmentStatus==='SHIPPED'||order.fulfillmentStatus==='DELIVERED')&&<div className={styles.shippingGrid}>
          <label>روش / شرکت ارسال<input value={shipInput.carrier} disabled={order.fulfillmentStatus!=='READY_TO_SHIP'} placeholder="مثلاً پست پیشتاز" onChange={event=>setShipping(current=>({...current,[order.id]:{...shipInput,carrier:event.target.value}}))}/></label>
          <label>کد رهگیری<input value={shipInput.tracking} disabled={order.fulfillmentStatus!=='READY_TO_SHIP'} placeholder="کد رهگیری" dir="ltr" onChange={event=>setShipping(current=>({...current,[order.id]:{...shipInput,tracking:event.target.value}}))}/></label>
        </div>}

        <div className={styles.footer}><div className={styles.metaLine}><span>ثبت: {date(order.createdAt)}</span><span>ارسال: {date(order.shippedAt)}</span><span>تحویل: {date(order.deliveredAt)}</span></div><div className={styles.actions}>{target?<button disabled={busyId===order.id} onClick={()=>advance(order)}>{busyId===order.id?'در حال ثبت…':actionLabel[order.fulfillmentStatus]}</button>:<strong className={styles.doneText}>تکمیل‌شده</strong>}{order.invoiceNumber&&<a href={`${storefrontBase}/invoice/${encodeURIComponent(order.invoiceNumber)}`} target="_blank" rel="noreferrer">فاکتور</a>}</div></div>
      </article>;
    })}{filteredOrders.length===0&&<div className={styles.empty}>سفارشی با این فیلتر پیدا نشد.</div>}</div>
  </>;
}
