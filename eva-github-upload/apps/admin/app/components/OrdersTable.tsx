'use client';

import { useMemo, useState } from 'react';

type Order={id:string;orderNumber:string;status:string;fulfillmentStatus?:string;customerName:string;mobile:string;city:string;totalToman:number;createdAt:string;item:null|{productNameFa:string;unitSku:string;exactWeightGram:string};payment:null|{provider:string;status:string;referenceId:string|null;paidAt:string|null};invoiceNumber:string|null};
const labels:Record<string,string>={PAID:'پرداخت‌شده',PENDING_PAYMENT:'در انتظار پرداخت',REFUND_PENDING:'در انتظار بازپرداخت',REFUNDED:'بازپرداخت‌شده',CANCELLED:'لغوشده',SUCCEEDED:'موفق',FAILED:'ناموفق',REGISTERED:'ثبت‌شده',PREPARING:'در آماده‌سازی',READY_TO_SHIP:'آماده ارسال',SHIPPED:'ارسال‌شده',DELIVERED:'تحویل‌شده'};
const faDate=(value:string)=>new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
const normalize=(value:string)=>value.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).toLowerCase();

export default function OrdersTable({orders,initialStatus,initialFulfillment}:{orders:Order[];initialStatus?:string;initialFulfillment?:string}){
  const allowedStatus=new Set(['PAID','PENDING_PAYMENT','REFUND_PENDING','REFUNDED','CANCELLED']);
  const allowedFulfillment=new Set(['REGISTERED','PREPARING','READY_TO_SHIP','SHIPPED','DELIVERED']);
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState(initialStatus&&allowedStatus.has(initialStatus)?initialStatus:'ALL');
  const [fulfillment,setFulfillment]=useState(initialFulfillment&&allowedFulfillment.has(initialFulfillment)?initialFulfillment:'ALL');
  const [period,setPeriod]=useState('ALL');
  const [sort,setSort]=useState('NEWEST');

  const result=useMemo(()=>{
    const now=Date.now();
    const days=period==='7D'?7:period==='30D'?30:null;
    return orders.filter(order=>{
      const q=normalize(query.trim());
      const text=normalize([order.orderNumber,order.customerName,order.mobile,order.city,order.item?.productNameFa,order.item?.unitSku].filter(Boolean).join(' '));
      const inPeriod=days===null||new Date(order.createdAt).getTime()>=now-days*24*60*60*1000;
      return (!q||text.includes(q))&&(status==='ALL'||order.status===status)&&(fulfillment==='ALL'||order.fulfillmentStatus===fulfillment)&&inPeriod;
    }).sort((a,b)=>{
      if(sort==='OLDEST')return new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime();
      if(sort==='VALUE_DESC')return b.totalToman-a.totalToman;
      if(sort==='VALUE_ASC')return a.totalToman-b.totalToman;
      return new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime();
    });
  },[orders,query,status,fulfillment,period,sort]);

  return <section className="panel">
    <div className="v2Toolbar">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="شماره سفارش، مشتری، موبایل، محصول یا Unit"/>
      <select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">همه وضعیت سفارش</option><option value="PAID">پرداخت‌شده</option><option value="PENDING_PAYMENT">در انتظار پرداخت</option><option value="REFUND_PENDING">در انتظار بازپرداخت</option><option value="REFUNDED">بازپرداخت‌شده</option><option value="CANCELLED">لغوشده</option></select>
      <select value={fulfillment} onChange={e=>setFulfillment(e.target.value)}><option value="ALL">همه Fulfillment</option><option value="REGISTERED">ثبت‌شده</option><option value="PREPARING">در آماده‌سازی</option><option value="READY_TO_SHIP">آماده ارسال</option><option value="SHIPPED">ارسال‌شده</option><option value="DELIVERED">تحویل‌شده</option></select>
      <select value={period} onChange={e=>setPeriod(e.target.value)}><option value="ALL">همه تاریخ‌ها</option><option value="7D">۷ روز اخیر</option><option value="30D">۳۰ روز اخیر</option></select>
      <select value={sort} onChange={e=>setSort(e.target.value)}><option value="NEWEST">جدیدترین</option><option value="OLDEST">قدیمی‌ترین</option><option value="VALUE_DESC">بیشترین مبلغ</option><option value="VALUE_ASC">کمترین مبلغ</option></select>
      <span>{new Intl.NumberFormat('fa-IR').format(result.length)} سفارش</span>
    </div>
    <div className="tableWrap"><table><thead><tr><th>سفارش</th><th>مشتری</th><th>محصول</th><th>مبلغ</th><th>وضعیت</th><th>Fulfillment</th><th>تاریخ</th><th></th></tr></thead><tbody>
      {result.map(order=><tr key={order.id}><td><strong dir="ltr">{order.orderNumber}</strong><small>{labels[order.status]??order.status}</small></td><td><strong>{order.customerName}</strong><small dir="ltr">{order.mobile}</small></td><td><strong>{order.item?.productNameFa??'—'}</strong><small dir="ltr">{order.item?.unitSku??''}</small></td><td>{new Intl.NumberFormat('fa-IR').format(order.totalToman)} تومان</td><td><span className={`badge ${order.status.toLowerCase()}`}>{labels[order.status]??order.status}</span></td><td><span className="badge">{labels[order.fulfillmentStatus??'']??order.fulfillmentStatus??'—'}</span></td><td>{faDate(order.createdAt)}</td><td><a className="v2RowLink" href={`/orders/${order.id}`}>جزئیات ←</a></td></tr>)}
      {result.length===0&&<tr><td colSpan={8}>سفارشی با این فیلتر پیدا نشد.</td></tr>}
    </tbody></table></div>
  </section>;
}
