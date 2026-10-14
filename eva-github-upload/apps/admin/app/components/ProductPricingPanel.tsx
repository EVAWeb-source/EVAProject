'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './ProductPricingPanel.module.css';

type Pricing={
  productId:string;
  makingPercent:number|null;
  profitPercent:number|null;
  taxPercent:number|null;
  source?:string;
  repricedUnits?:number;
};

async function request(path:string,method:'GET'|'PATCH',payload?:Record<string,unknown>){
  const response=await fetch('/api/admin/'+path,{
    method,
    headers:payload?{'content-type':'application/json'}:undefined,
    body:payload?JSON.stringify(payload):undefined,
    cache:'no-store',
  });
  const raw=await response.text();
  if(!response.ok){
    try{const parsed=JSON.parse(raw);throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));}
    catch(error){if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;throw new Error(raw||`HTTP ${response.status}`);}
  }
  return raw?JSON.parse(raw):null;
}

export default function ProductPricingPanel({productId}:{productId:string}){
  const [pricing,setPricing]=useState<Pricing|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');

  async function load(){
    try{setError('');setPricing(await request(`product-pricing/${productId}`,'GET') as Pricing);}
    catch(cause){setError(cause instanceof Error?cause.message:'قیمت‌گذاری محصول قابل دریافت نیست.');}
  }

  useEffect(()=>{void load();},[productId]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
    const data=new FormData(event.currentTarget);
    try{
      const result=await request(`product-pricing/${productId}`,'PATCH',{
        makingPercent:Number(data.get('makingPercent')),
        profitPercent:Number(data.get('profitPercent')),
        taxPercent:Number(data.get('taxPercent')),
      }) as Pricing;
      setPricing(result);
      setMessage(`قیمت‌گذاری محصول ذخیره شد و ${new Intl.NumberFormat('fa-IR').format(result.repricedUnits??0)} Unit همین محصول بروزرسانی شد.`);
      window.dispatchEvent(new Event('eva-admin-catalog-change'));
    }catch(cause){setError(cause instanceof Error?cause.message:'ذخیره قیمت‌گذاری انجام نشد.');}
    finally{setBusy(false);}
  }

  return <section className={styles.panel}>
    <div className={styles.head}>
      <div><span>PRODUCT PRICING</span><h2>قیمت‌گذاری این محصول</h2></div>
      <small>{pricing?.source==='LEGACY_FALLBACK'?'مقادیر قدیمی؛ با ذخیره به محصول منتقل می‌شوند':'مستقل از سایر محصولات'}</small>
    </div>
    <p className={styles.description}>نرخ هر گرم طلا از بخش «نرخ طلا» می‌آید. اجرت، سود و مالیات فقط برای همین محصول هستند؛ تغییر این اعداد فقط Unitهای همین محصول را Reprice می‌کند.</p>
    {error&&<div className={styles.error}>{error}</div>}
    {message&&<div className={styles.success}>{message}</div>}
    {pricing?<form className={styles.form} onSubmit={submit}>
      <label>اجرت (%)<input name="makingPercent" type="number" min="0" max="100" step="0.001" required defaultValue={pricing.makingPercent??''}/></label>
      <label>سود (%)<input name="profitPercent" type="number" min="0" max="100" step="0.001" required defaultValue={pricing.profitPercent??''}/></label>
      <label>مالیات (%)<input name="taxPercent" type="number" min="0" max="100" step="0.001" required defaultValue={pricing.taxPercent??''}/></label>
      <button disabled={busy}>{busy?'در حال ذخیره…':'ذخیره قیمت‌گذاری محصول'}</button>
    </form>:!error?<div className={styles.loading}>در حال دریافت…</div>:null}
    <div className={styles.note}><strong>سنگ</strong><span>قیمت سنگ روی هر Unit ثبت می‌شود چون قیراط و مشخصات سنگ می‌تواند بین قطعات یک مدل متفاوت باشد.</span></div>
  </section>;
}
