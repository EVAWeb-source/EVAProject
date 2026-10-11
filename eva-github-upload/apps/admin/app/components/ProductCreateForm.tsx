'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProductCreateForm.module.css';

type Collection={id:string;nameFa:string;slug:string;code:string};
type CreatedProduct={id:string;nameFa:string;masterSku:string};

async function createProduct(payload:Record<string,unknown>){
  const response=await fetch('/api/admin/products',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify(payload),
  });
  const raw=await response.text();
  if(!response.ok){
    try{
      const parsed=JSON.parse(raw);
      throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));
    }catch(error){
      if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;
      throw new Error(raw||`HTTP ${response.status}`);
    }
  }
  return JSON.parse(raw) as CreatedProduct;
}

export default function ProductCreateForm({collections}:{collections:Collection[]}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError('');
    const data=new FormData(event.currentTarget);
    try{
      const product=await createProduct({
        nameFa:data.get('nameFa'),
        slug:String(data.get('slug')??'').trim().toLowerCase(),
        masterSku:String(data.get('masterSku')??'').trim().toUpperCase(),
        purity:Number(data.get('purity')??18),
        collectionId:data.get('collectionId')||null,
        status:'DRAFT',
      });
      window.dispatchEvent(new Event('eva-admin-catalog-change'));
      router.push(`/catalog/products/${product.id}`);
      router.refresh();
    }catch(cause){
      setError(cause instanceof Error?cause.message:'ساخت محصول انجام نشد.');
      setBusy(false);
    }
  }

  return <section className={styles.wrap}>
    <div className={styles.intro}>
      <span>NEW MASTER PRODUCT</span>
      <h2>محصول را ابتدا به‌صورت Draft بساز</h2>
      <p>بعد از ساخت، محتوا و تصاویر، Unitهای واقعی و در نهایت Publish را از صفحه همان محصول تکمیل می‌کنی.</p>
    </div>
    {error&&<div className={styles.error}>{error}</div>}
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.grid2}>
        <label>نام فارسی محصول<input name="nameFa" required autoFocus placeholder="مثلاً طلوع"/></label>
        <label>Slug انگلیسی<input name="slug" dir="ltr" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="tolou"/><small>فقط حروف کوچک انگلیسی، عدد و خط تیره</small></label>
      </div>
      <div className={styles.grid2}>
        <label>Master SKU<input name="masterSku" dir="ltr" required pattern="EVA-[A-Z0-9-]+" placeholder="EVA-AGH-NEC-TOL-001"/><small>با EVA- شروع شود و یکتا باشد</small></label>
        <label>عیار<input name="purity" type="number" min="1" max="24" step="1" defaultValue="18" required/></label>
      </div>
      <label>کالکشن<select name="collectionId" defaultValue=""><option value="">بدون کالکشن</option>{collections.map(collection=><option key={collection.id} value={collection.id}>{collection.nameFa}</option>)}</select></label>
      <div className={styles.note}><strong>وضعیت اولیه: پیش‌نویس</strong><span>محصول تا وقتی محتوا، تصویر و Unit موجود نداشته باشد وارد فروشگاه نمی‌شود.</span></div>
      <div className={styles.actions}><a href="/catalog">انصراف</a><button disabled={busy}>{busy?'در حال ساخت…':'ساخت محصول و ادامه'}</button></div>
    </form>
  </section>;
}
