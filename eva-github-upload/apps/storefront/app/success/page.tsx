'use client';

import { useEffect, useState } from 'react';
import styles from './success.module.css';

type OrderItem={name:string;weight:string};
type Order={
  number:string;
  name:string;
  weight:string;
  items?:OrderItem[];
  price:number;
  status:string;
  referenceId?:string|null;
  invoiceNumber?:string|null;
  verificationCode?:string|null;
  paymentToken?:string|null;
};
type PaymentItem={name:string;weightGram:string;priceToman:number};
type ApiPayment={
  token:string;
  status:string;
  referenceId:string|null;
  invoice:{invoiceNumber:string;verificationCode:string}|null;
  order:{
    number:string;
    status:string;
    totalToman:number;
    item:PaymentItem|null;
    items:PaymentItem[];
  };
};

const apiBase=process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';
function toman(value:number){return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;}
function faWeight(value:string){return `${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;}

export default function SuccessPage(){
  const [order,setOrder]=useState<Order|null>(null);

  useEffect(()=>{
    const orderNumber=new URLSearchParams(window.location.search).get('order');
    let cancelled=false;

    async function load(){
      let stored:Order|null=null;
      try{
        const raw=window.localStorage.getItem('eva-last-order');
        if(raw)stored=JSON.parse(raw) as Order;
      }catch{}

      if(stored && (!orderNumber || stored.number===orderNumber)){
        if(!cancelled)setOrder(stored);

        if(stored.paymentToken){
          try{
            const response=await fetch(`${apiBase}/api/v1/payments/demo/${encodeURIComponent(stored.paymentToken)}`,{cache:'no-store'});
            if(response.ok){
              const data:ApiPayment=await response.json();
              if(data.status==='SUCCEEDED' && (!orderNumber || data.order.number===orderNumber)){
                const apiItems=data.order.items?.length?data.order.items:(data.order.item?[data.order.item]:[]);
                const items=apiItems.map(item=>({name:item.name,weight:faWeight(item.weightGram)}));
                const verified:Order={
                  number:data.order.number,
                  name:items.length===1?items[0].name:`${new Intl.NumberFormat('fa-IR').format(items.length)} قطعه از ایوا`,
                  weight:items.length===1?items[0].weight:'',
                  items,
                  price:data.order.totalToman,
                  status:data.order.status==='PAID'?'پرداخت شد':data.order.status,
                  referenceId:data.referenceId,
                  invoiceNumber:data.invoice?.invoiceNumber ?? null,
                  verificationCode:data.invoice?.verificationCode ?? null,
                  paymentToken:data.token,
                };
                if(cancelled)return;
                setOrder(verified);
                window.localStorage.setItem('eva-last-order',JSON.stringify(verified));
              }
            }
          }catch{}
        }
      }
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
      {order&&<div className={styles.orderBox}>
        <div><span>شماره سفارش</span><strong>{order.number}</strong></div>
        {(order.items?.length?order.items:[{name:order.name,weight:order.weight}]).map((item,index)=><div key={`${item.name}-${index}`}><span>{(order.items?.length??1)>1?`قطعه ${new Intl.NumberFormat('fa-IR').format(index+1)}`:'محصول'}</span><strong>{item.name}{item.weight?` • ${item.weight}`:''}</strong></div>)}
        <div><span>مبلغ</span><strong>{toman(order.price)}</strong></div>
        <div><span>وضعیت</span><strong>{order.status}</strong></div>
        {order.referenceId&&<div><span>کد مرجع آزمایشی</span><strong dir="ltr">{order.referenceId}</strong></div>}
        {order.invoiceNumber&&<div><span>شماره فاکتور</span><strong dir="ltr">{order.invoiceNumber}</strong></div>}
      </div>}
      <div className={styles.actions}>{order?.invoiceNumber&&order?.paymentToken&&<a className={styles.primary} href={`/invoice/${encodeURIComponent(order.invoiceNumber)}?accessToken=${encodeURIComponent(order.paymentToken)}`}>مشاهده فاکتور</a>}{order?.verificationCode&&<a className={styles.secondary} href={`/verify/${encodeURIComponent(order.verificationCode)}`}>تأیید فاکتور</a>}<a className={styles.secondary} href="/shop">ادامه خرید</a><a className={styles.secondary} href="/">بازگشت به خانه</a></div>
    </section>
  </main>;
}
