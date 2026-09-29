'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './checkout.module.css';

type CartItem = { name:string; weight:string; purity:string; price:number; unitId:string; unitSku?:string };
type ApiOrder = {
  number:string;
  status:string;
  isDemo:boolean;
  totalToman:number;
  item:{ name:string; unitSku:string; weightGram:string; purity:number; priceToman:number } | null;
};

function toman(value:number){return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;}
function faWeight(value:string){return `${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;}

export default function CheckoutPage(){
  const [item,setItem]=useState<CartItem|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    const raw=window.localStorage.getItem('eva-cart');
    if(raw){try{setItem(JSON.parse(raw));}catch{}}
  },[]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!item || loading)return;

    setLoading(true);
    setError('');

    const form=new FormData(event.currentTarget);
    const apiBase=process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';

    try{
      const response=await fetch(`${apiBase}/api/v1/orders`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          unitId:item.unitId,
          customerName:String(form.get('customerName')??''),
          mobile:String(form.get('mobile')??''),
          province:String(form.get('province')??''),
          city:String(form.get('city')??''),
          address:String(form.get('address')??''),
          postalCode:String(form.get('postalCode')??''),
          recipientName:String(form.get('recipientName')??''),
        }),
      });

      if(!response.ok){
        const body=await response.text();
        throw new Error(body || `HTTP ${response.status}`);
      }

      const saved:ApiOrder=await response.json();
      const order={
        number:saved.number,
        name:saved.item?.name ?? item.name,
        weight:saved.item ? faWeight(saved.item.weightGram) : item.weight,
        price:saved.totalToman,
        status:'ثبت شد',
      };

      window.localStorage.setItem('eva-last-order',JSON.stringify(order));
      window.localStorage.removeItem('eva-cart');
      window.location.href='/success';
    }catch(err){
      console.error(err);
      setError('ثبت سفارش انجام نشد. لطفاً دوباره تلاش کن.');
      setLoading(false);
    }
  }

  if(!item){
    return <main className={styles.empty}><a href="/" className={styles.brand}>EVA</a><h1>سبد خریدی برای پرداخت پیدا نشد.</h1><a href="/shop" className={styles.primary}>بازگشت به فروشگاه</a></main>;
  }

  return <main className={styles.page}>
    <header className={styles.header}><a href="/" className={styles.brand}>EVA</a><span>پرداخت امن</span></header>
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.intro}><span>CHECKOUT</span><h1>تکمیل سفارش</h1><p>اطلاعات را وارد کن؛ این سفارش در دیتابیس EVA ثبت می‌شود اما هنوز پرداخت واقعی انجام نمی‌شود.</p></div>
        <section><h2><b>۱</b> اطلاعات تماس</h2><div className={styles.grid2}><label>نام و نام خانوادگی<input name="customerName" required placeholder="مثلاً حسین شاپوریان" /></label><label>شماره موبایل<input name="mobile" required inputMode="tel" placeholder="۰۹۱۲..." /></label></div></section>
        <section><h2><b>۲</b> آدرس ارسال</h2><div className={styles.grid2}><label>استان<input name="province" required placeholder="استان" /></label><label>شهر<input name="city" required placeholder="شهر" /></label></div><label>آدرس کامل<textarea name="address" required placeholder="خیابان، کوچه، پلاک و واحد" /></label><div className={styles.grid2}><label>کدپستی<input name="postalCode" required inputMode="numeric" placeholder="۱۰ رقم" /></label><label>نام گیرنده<input name="recipientName" required placeholder="نام گیرنده" /></label></div></section>
        <section><h2><b>۳</b> روش ارسال</h2><label className={styles.choice}><input type="radio" name="shipping" defaultChecked /><span><strong>ارسال استاندارد EVA</strong><small>هزینه و زمان دقیق در اتصال لجستیک واقعی محاسبه می‌شود.</small></span><b>فعلاً رایگان</b></label></section>
        <section><h2><b>۴</b> پرداخت</h2><div className={styles.demoPay}><strong>حالت آزمایشی</strong><p>درگاه واقعی بعداً متصل می‌شود. در این مرحله سفارش واقعی در دیتابیس ثبت می‌شود، اما هیچ مبلغی جابه‌جا نمی‌شود.</p></div></section>
        {error&&<p role="alert" style={{color:'#8b2f2f',margin:'0 0 16px'}}>{error}</p>}
        <button className={styles.payButton} disabled={loading}>{loading?'در حال ثبت سفارش...':`ثبت سفارش آزمایشی • ${toman(item.price)}`}</button>
      </form>
      <aside className={styles.summary}><span>ORDER SUMMARY</span><h2>سفارش تو</h2><div className={styles.product}><div className={styles.visual}><i /><b /></div><div><strong>{item.name}</strong><small>{item.weight} • {item.purity}</small><small>کد قطعه: {item.unitSku ?? item.unitId}</small></div></div><div className={styles.rows}><div><span>محصول</span><strong>{toman(item.price)}</strong></div><div><span>ارسال</span><strong>رایگان</strong></div></div><div className={styles.total}><span>مبلغ نهایی</span><strong>{toman(item.price)}</strong></div><p>هنگام ثبت سفارش، قیمت نهایی دوباره از دیتابیس EVA بررسی می‌شود.</p></aside>
    </div>
  </main>;
}
