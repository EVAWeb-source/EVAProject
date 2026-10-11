'use client';

import { useMemo, useState } from 'react';
import styles from './OrdersTable.module.css';

type OrderItem={productNameFa:string;unitSku:string;exactWeightGram:string;unitPriceToman?:number};
type Order={id:string;orderNumber:string;status:string;fulfillmentStatus?:string;customerName:string;mobile:string;city:string;totalToman:number;createdAt:string;itemCount:number;items:OrderItem[];item:OrderItem|null;payment:null|{provider:string;status:string;referenceId:string|null;paidAt:string|null};invoiceNumber:string|null};

const labels:Record<string,string>={
  PAID:'پرداخت‌شده',PENDING_PAYMENT:'در انتظار پرداخت',REFUND_PENDING:'در انتظار بازپرداخت',REFUNDED:'بازپرداخت‌شده',CANCELLED:'لغوشده',
  SUCCEEDED:'موفق',FAILED:'ناموفق',INITIATED:'شروع‌شده',REGISTERED:'ثبت‌شده',PREPARING:'در آماده‌سازی',READY_TO_SHIP:'آماده ارسال',SHIPPED:'ارسال‌شده',DELIVERED:'تحویل‌شده',
};

const faNumber=(value:number)=>new Intl.NumberFormat('fa-IR').format(value);
const toman=(value:number)=>`${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
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
      const items=order.items?.length?order.items:order.item?[order.item]:[];
      const itemText=items.flatMap(item=>[item.productNameFa,item.unitSku]).join(' ');
      const text=normalize([order.orderNumber,order.customerName,order.mobile,order.city,itemText].filter(Boolean).join(' '));
      const inPeriod=days===null||new Date(order.createdAt).getTime()>=now-days*24*60*60*1000;
      return (!q||text.includes(q))&&(status==='ALL'||order.status===status)&&(fulfillment==='ALL'||order.fulfillmentStatus===fulfillment)&&inPeriod;
    }).sort((a,b)=>{
      if(sort==='OLDEST')return new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime();
      if(sort==='VALUE_DESC')return b.totalToman-a.totalToman;
      if(sort==='VALUE_ASC')return a.totalToman-b.totalToman;
      return new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime();
    });
  },[orders,query,status,fulfillment,period,sort]);

  return <div className={styles.wrap}>
    <section className={styles.filters}>
      <div className={styles.searchRow}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="شماره سفارش، مشتری، موبایل، محصول یا Unit" />
        <span>{faNumber(result.length)} سفارش</span>
      </div>
      <div className={styles.filterRow}>
        <select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">همه وضعیت سفارش</option><option value="PAID">پرداخت‌شده</option><option value="PENDING_PAYMENT">در انتظار پرداخت</option><option value="REFUND_PENDING">در انتظار بازپرداخت</option><option value="REFUNDED">بازپرداخت‌شده</option><option value="CANCELLED">لغوشده</option></select>
        <select value={fulfillment} onChange={e=>setFulfillment(e.target.value)}><option value="ALL">همه وضعیت ارسال</option><option value="REGISTERED">ثبت‌شده</option><option value="PREPARING">در آماده‌سازی</option><option value="READY_TO_SHIP">آماده ارسال</option><option value="SHIPPED">ارسال‌شده</option><option value="DELIVERED">تحویل‌شده</option></select>
        <select value={period} onChange={e=>setPeriod(e.target.value)}><option value="ALL">همه تاریخ‌ها</option><option value="7D">۷ روز اخیر</option><option value="30D">۳۰ روز اخیر</option></select>
        <select value={sort} onChange={e=>setSort(e.target.value)}><option value="NEWEST">جدیدترین</option><option value="OLDEST">قدیمی‌ترین</option><option value="VALUE_DESC">بیشترین مبلغ</option><option value="VALUE_ASC">کمترین مبلغ</option></select>
      </div>
    </section>

    <section className={styles.list}>
      {result.map(order=>{
        const items=order.items?.length?order.items:order.item?[order.item]:[];
        return <article className={styles.card} key={order.id}>
          <header className={styles.cardHead}>
            <div className={styles.orderIdentity}>
              <div className={styles.orderNumberLine}><strong dir="ltr">{order.orderNumber}</strong><span className={`badge ${order.status.toLowerCase()}`}>{labels[order.status]??order.status}</span></div>
              <time>{faDate(order.createdAt)}</time>
            </div>
            <a className={styles.detailButton} href={`/orders/${order.id}`}>مشاهده سفارش <span>←</span></a>
          </header>

          <div className={styles.cardBody}>
            <section className={styles.customerBlock}>
              <span className={styles.label}>مشتری</span>
              <strong>{order.customerName}</strong>
              <small><span dir="ltr">{order.mobile}</span>{order.city?` • ${order.city}`:''}</small>
            </section>

            <section className={styles.itemsBlock}>
              <div className={styles.itemsHead}><span className={styles.label}>قطعات سفارش</span><b>{faNumber(items.length)} قطعه</b></div>
              <div className={styles.itemsList}>{items.map(item=><div className={styles.item} key={item.unitSku}>
                <div><strong>{item.productNameFa}</strong><small dir="ltr">{item.unitSku}</small></div>
                <div className={styles.itemMeta}><span>{item.exactWeightGram} گرم</span>{item.unitPriceToman!==undefined&&<b>{toman(item.unitPriceToman)}</b>}</div>
              </div>)}</div>
            </section>

            <section className={styles.totalBlock}>
              <span className={styles.label}>مبلغ سفارش</span>
              <strong>{toman(order.totalToman)}</strong>
              <small>{order.payment?`پرداخت: ${labels[order.payment.status]??order.payment.status}`:'بدون رکورد پرداخت'}</small>
            </section>
          </div>

          <footer className={styles.cardFoot}>
            <div><span>ارسال</span><strong>{labels[order.fulfillmentStatus??'']??order.fulfillmentStatus??'—'}</strong></div>
            <div><span>درگاه</span><strong>{order.payment?.provider??'—'}</strong></div>
            <div><span>فاکتور</span><strong dir="ltr">{order.invoiceNumber??'—'}</strong></div>
            {order.payment?.referenceId&&<div><span>Reference</span><strong dir="ltr">{order.payment.referenceId}</strong></div>}
          </footer>
        </article>;
      })}
      {result.length===0&&<div className={styles.empty}>سفارشی با این فیلتر پیدا نشد.</div>}
    </section>
  </div>;
}
