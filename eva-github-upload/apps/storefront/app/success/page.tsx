'use client';

import { useEffect, useState } from 'react';
import styles from './success.module.css';

type Order = { number:string; name:string; weight:string; price:number; status:string; referenceId?:string|null; invoiceNumber?:string|null; verificationCode?:string|null };
type ApiOrder = {
  number:string;
  status:string;
  totalToman:number;
  payment:{status:string;referenceId:string|null}|null;
  item:{name:string;weightGram:string}|null;
};
type ApiInvoice={invoiceNumber:string;verificationCode:string};

const apiBase=process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';
function toman(value:number){return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;}
function faWeight(value:string){return `${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;}

export default function SuccessPage(){
  const [order,setOrder]=useState<Order|null>(null);

  useEffect(()=>{
    const orderNumber=new URLSearchParams(window.location.search).get('order');
    let cancelled=false;

    async function load(){
      if(orderNumber){
        try{
          const [orderResponse,invoiceResponse]=await Promise.all([
            fetch(`${apiBase}/api/v1/orders/${encodeURIComponent(orderNumber)}`,{cache:'no-store'}),
            fetch(`${apiBase}/api/v1/invoices/order/${encodeURIComponent(orderNumber)}`,{cache:'no-store'}),
          ]);
          if(orderResponse.ok){
            const data:ApiOrder=await orderResponse.json();
            const invoice:ApiInvoice|null=invoiceResponse.ok?await invoiceResponse.json():null;
            if(cancelled)return;
            const verified:Order={
              number:data.number,
              name:data.item?.name ?? 'سفارش EVA',
              weight:data.item ? faWeight(data.item.weightGram) : '',
              price:data.totalToman,
              status:data.status==='PAID'?'پرداخت شد':data.status,
              referenceId:data.payment?.referenceId ?? null,
              invoiceNumber:invoice?.invoiceNumber ?? null,
              verificationCode:invoice?.verificationCode ?? null,
            };
            setOrder(verified);
            window.localStorage.setItem('eva-last-order',JSON.stringify(verified));
            return;
          }
        }catch{}
      }

      const raw=window.localStorage.getItem('eva-last-order');
      if(raw){try{setOrder(JSON.parse(raw));}catch{}}
    }

    void load();
    return()=>{cancelled=true;};
  },[]);

  return <main className={styles.page}>
    <header><a href="/" className={styles.brand}>EVA</a></header>
    <section className={styles.successCard}>
      <div className={styles.mark}>✓</div>
      <span>PAYMENT CONFIRMED</span>
      <h1>پرداخت آزمایشی تأیید شد.</h1>
      <p>جریان پرداخت با موفقیت تست شد. این تراکنش شبیه‌سازی‌شده است و هیچ مبلغ بانکی واقعی جابه‌جا نشده.</p>
      {order&&<div className={styles.orderBox}><div><span>شماره سفارش</span><strong>{order.number}</strong></div><div><span>محصول</span><strong>{order.name} • {order.weight}</strong></div><div><span>مبلغ</span><strong>{toman(order.price)}</strong></div><div><span>وضعیت</span><strong>{order.status}</strong></div>{order.referenceId&&<div><span>کد مرجع آزمایشی</span><strong dir="ltr">{order.referenceId}</strong></div>}{order.invoiceNumber&&<div><span>شماره فاکتور</span><strong dir="ltr">{order.invoiceNumber}</strong></div>}</div>}
      <div className={styles.actions}>{order?.invoiceNumber&&<a className={styles.primary} href={`/invoice/${encodeURIComponent(order.invoiceNumber)}`}>مشاهده فاکتور</a>}{order?.verificationCode&&<a className={styles.secondary} href={`/verify/${encodeURIComponent(order.verificationCode)}`}>تأیید فاکتور</a>}<a className={styles.secondary} href="/shop">ادامه خرید</a><a className={styles.secondary} href="/">بازگشت به خانه</a></div>
    </section>
  </main>;
}
