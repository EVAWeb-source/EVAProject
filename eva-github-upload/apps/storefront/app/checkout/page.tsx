'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './checkout.module.css';

type CartItem = { name:string; weight:string; purity:string; price:number; unitId:string };

function toman(value:number){return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;}

export default function CheckoutPage(){
  const [item,setItem]=useState<CartItem|null>(null);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    const raw=window.localStorage.getItem('eva-cart');
    if(raw){try{setItem(JSON.parse(raw));}catch{}}
  },[]);

  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!item)return;
    setLoading(true);
    const order={number:'EVA-2026-001234',name:item.name,weight:item.weight,price:item.price,status:'ثبت شد'};
    window.localStorage.setItem('eva-last-order',JSON.stringify(order));
    window.localStorage.removeItem('eva-cart');
    window.setTimeout(()=>{window.location.href='/success';},650);
  }

  if(!item){
    return <main className={styles.empty}><a href="/" className={styles.brand}>EVA</a><h1>سبد خریدی برای پرداخت پیدا نشد.</h1><a href="/shop" className={styles.primary}>بازگشت به فروشگاه</a></main>;
  }

  return <main className={styles.page}>
    <header className={styles.header}><a href="/" className={styles.brand}>EVA</a><span>پرداخت امن</span></header>
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.intro}><span>CHECKOUT</span><h1>تکمیل سفارش</h1><p>اطلاعات را وارد کن؛ برای این نسخه آزمایشی هیچ پرداخت واقعی انجام نمی‌شود.</p></div>
        <section><h2><b>۱</b> اطلاعات تماس</h2><div className={styles.grid2}><label>نام و نام خانوادگی<input required placeholder="مثلاً حسین شاپوریان" /></label><label>شماره موبایل<input required inputMode="tel" placeholder="۰۹۱۲..." /></label></div></section>
        <section><h2><b>۲</b> آدرس ارسال</h2><div className={styles.grid2}><label>استان<input required placeholder="استان" /></label><label>شهر<input required placeholder="شهر" /></label></div><label>آدرس کامل<textarea required placeholder="خیابان، کوچه، پلاک و واحد" /></label><div className={styles.grid2}><label>کدپستی<input required inputMode="numeric" placeholder="۱۰ رقم" /></label><label>نام گیرنده<input required placeholder="نام گیرنده" /></label></div></section>
        <section><h2><b>۳</b> روش ارسال</h2><label className={styles.choice}><input type="radio" name="shipping" defaultChecked /><span><strong>ارسال استاندارد EVA</strong><small>هزینه و زمان دقیق در اتصال لجستیک واقعی محاسبه می‌شود.</small></span><b>فعلاً رایگان</b></label></section>
        <section><h2><b>۴</b> پرداخت</h2><div className={styles.demoPay}><strong>حالت آزمایشی</strong><p>درگاه واقعی در مرحله اتصال Payment Gateway اضافه می‌شود. این دکمه فقط مسیر خرید را شبیه‌سازی می‌کند.</p></div></section>
        <button className={styles.payButton} disabled={loading}>{loading?'در حال ثبت سفارش...':`ثبت سفارش آزمایشی • ${toman(item.price)}`}</button>
      </form>
      <aside className={styles.summary}><span>ORDER SUMMARY</span><h2>سفارش تو</h2><div className={styles.product}><div className={styles.visual}><i /><b /></div><div><strong>{item.name}</strong><small>{item.weight} • {item.purity}</small><small>کد قطعه: {item.unitId}</small></div></div><div className={styles.rows}><div><span>محصول</span><strong>{toman(item.price)}</strong></div><div><span>ارسال</span><strong>رایگان</strong></div></div><div className={styles.total}><span>مبلغ نهایی</span><strong>{toman(item.price)}</strong></div><p>قیمت نهایی این نسخه نمایشی است و هنوز به موتور قیمت طلا متصل نشده.</p></aside>
    </div>
  </main>;
}
