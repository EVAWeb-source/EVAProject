'use client';

import { useMemo, useState } from 'react';

type Order={id:string;orderNumber:string;status:string;fulfillmentStatus?:string;customerName:string;mobile:string;city:string;totalToman:number;createdAt:string;item:null|{productNameFa:string;unitSku:string;exactWeightGram:string};payment:null|{provider:string;status:string;referenceId:string|null;paidAt:string|null};invoiceNumber:string|null};
const labels:Record<string,string>={PAID:'پرداخت‌شده',PENDING_PAYMENT:'در انتظار پرداخت',CANCELLED:'لغوشده',SUCCEEDED:'موفق',FAILED:'ناموفق'};
const faDate=(value:string)=>new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));

export default function OrdersTable({orders}:{orders:Order[]}){
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('ALL');
  const result=useMemo(()=>orders.filter(order=>{
    const q=query.trim().toLowerCase();
    const text=[order.orderNumber,order.customerName,order.mobile,order.city,order.item?.productNameFa].filter(Boolean).join(' ').toLowerCase();
    return (!q||text.includes(q))&&(status==='ALL'||order.status===status);
  }),[orders,query,status]);
  return <section className="panel">
    <div className="v2Toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="شماره سفارش، مشتری، موبایل یا محصول"/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">همه وضعیت‌ها</option><option value="PAID">پرداخت‌شده</option><option value="PENDING_PAYMENT">در انتظار پرداخت</option><option value="CANCELLED">لغوشده</option></select><span>{new Intl.NumberFormat('fa-IR').format(result.length)} سفارش</span></div>
    <div className="tableWrap"><table><thead><tr><th>سفارش</th><th>مشتری</th><th>محصول</th><th>مبلغ</th><th>پرداخت</th><th>تاریخ</th><th></th></tr></thead><tbody>
      {result.map(order=><tr key={order.id}><td><strong dir="ltr">{order.orderNumber}</strong><small>{labels[order.status]??order.status}</small></td><td><strong>{order.customerName}</strong><small dir="ltr">{order.mobile}</small></td><td><strong>{order.item?.productNameFa??'—'}</strong><small dir="ltr">{order.item?.unitSku??''}</small></td><td>{new Intl.NumberFormat('fa-IR').format(order.totalToman)} تومان</td><td><span className={`badge ${(order.payment?.status??order.status).toLowerCase()}`}>{labels[order.payment?.status??order.status]??order.payment?.status??order.status}</span></td><td>{faDate(order.createdAt)}</td><td><a className="v2RowLink" href={`/orders/${order.id}`}>جزئیات ←</a></td></tr>)}
      {result.length===0&&<tr><td colSpan={7}>سفارشی با این فیلتر پیدا نشد.</td></tr>}
    </tbody></table></div>
  </section>;
}
