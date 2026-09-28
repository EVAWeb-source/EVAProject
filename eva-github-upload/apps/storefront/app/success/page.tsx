'use client';

import { useEffect, useState } from 'react';
import styles from './success.module.css';

type Order = { number:string; name:string; weight:string; price:number; status:string };
function toman(value:number){return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;}

export default function SuccessPage(){
  const [order,setOrder]=useState<Order|null>(null);
  useEffect(()=>{
    const raw=window.localStorage.getItem('eva-last-order');
    if(raw){try{setOrder(JSON.parse(raw));}catch{}}
  },[]);

  return <main className={styles.page}>
    <header><a href="/" className={styles.brand}>EVA</a></header>
    <section className={styles.successCard}>
      <div className={styles.mark}>✓</div>
      <span>ORDER CONFIRMED</span>
      <h1>سفارشت ثبت شد.</h1>
      <p>این سفارش آزمایشی است و هیچ مبلغی از حساب تو کسر نشده.</p>
      {order&&<div className={styles.orderBox}><div><span>شماره سفارش</span><strong>{order.number}</strong></div><div><span>محصول</span><strong>{order.name} • {order.weight}</strong></div><div><span>مبلغ</span><strong>{toman(order.price)}</strong></div><div><span>وضعیت</span><strong>{order.status}</strong></div></div>}
      <div className={styles.actions}><a className={styles.primary} href="/shop">ادامه خرید</a><a className={styles.secondary} href="/">بازگشت به خانه</a></div>
    </section>
  </main>;
}
