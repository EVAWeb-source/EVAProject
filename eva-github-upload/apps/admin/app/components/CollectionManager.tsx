'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CollectionManager.module.css';

type Collection={id:string;nameFa:string;slug:string;code:string};
type Product={id:string;collectionId:string|null};

async function request(path:string,method:'POST'|'PATCH'|'DELETE',payload?:Record<string,unknown>){
  const response=await fetch('/api/admin/'+path,{method,headers:payload?{'content-type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined});
  const raw=await response.text();
  if(!response.ok){try{const parsed=JSON.parse(raw);throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));}catch(error){if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;throw new Error(raw||`HTTP ${response.status}`);}}
  return raw?JSON.parse(raw):null;
}

export default function CollectionManager({collections,products}:{collections:Collection[];products:Product[]}){
  const router=useRouter();
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const counts=useMemo(()=>{const map=new Map<string,number>();for(const product of products){if(product.collectionId)map.set(product.collectionId,(map.get(product.collectionId)??0)+1);}return map;},[products]);
  function begin(key:string){setBusy(key);setMessage('');setError('');}

  async function create(event:FormEvent<HTMLFormElement>){event.preventDefault();begin('create');const form=event.currentTarget;const data=new FormData(form);try{await request('collections','POST',{nameFa:data.get('nameFa'),slug:String(data.get('slug')??'').toLowerCase(),code:String(data.get('code')??'').toUpperCase()});form.reset();setMessage('کالکشن جدید ساخته شد.');router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'ساخت کالکشن انجام نشد.');}finally{setBusy('');}}
  async function save(event:FormEvent<HTMLFormElement>,collection:Collection){event.preventDefault();begin(collection.id);const data=new FormData(event.currentTarget);try{await request(`collections/${collection.id}`,'PATCH',{nameFa:data.get('nameFa'),slug:String(data.get('slug')??'').toLowerCase(),code:String(data.get('code')??'').toUpperCase()});setMessage(`کالکشن «${collection.nameFa}» بروزرسانی شد.`);router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'بروزرسانی کالکشن انجام نشد.');}finally{setBusy('');}}
  async function remove(collection:Collection){const count=counts.get(collection.id)??0;if(count>0){setError(`این کالکشن ${new Intl.NumberFormat('fa-IR').format(count)} محصول دارد؛ اول محصولات را منتقل کن.`);return;}if(!window.confirm(`کالکشن «${collection.nameFa}» حذف شود؟`))return;begin(collection.id);try{await request(`collections/${collection.id}`,'DELETE');setMessage('کالکشن حذف شد.');router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'حذف کالکشن انجام نشد.');}finally{setBusy('');}}

  return <section className={styles.wrap}>
    {(message||error)&&<div className={error?styles.error:styles.success}>{error||message}</div>}
    <form className={styles.create} onSubmit={create}>
      <div className={styles.createTitle}><h2>کالکشن جدید</h2><p>نام، Slug و کد کوتاه کالکشن را ثبت کن.</p></div>
      <label>نام فارسی<input name="nameFa" required placeholder="مثلاً آغاز"/></label>
      <label>Slug<input name="slug" dir="ltr" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="aghaz"/></label>
      <label>Code<input name="code" dir="ltr" required pattern="[A-Z0-9-]{2,12}" placeholder="AGH"/></label>
      <button disabled={Boolean(busy)}>ساخت</button>
    </form>

    <div className={styles.list}>{collections.map(collection=>{const count=counts.get(collection.id)??0;return <form key={collection.id} className={styles.card} onSubmit={event=>save(event,collection)}>
      <div className={styles.identity}><strong>{collection.nameFa}</strong><span>{new Intl.NumberFormat('fa-IR').format(count)} محصول</span><code dir="ltr">{collection.code}</code></div>
      <label>نام<input name="nameFa" defaultValue={collection.nameFa} required/></label>
      <label>Slug<input name="slug" dir="ltr" defaultValue={collection.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*"/></label>
      <label>Code<input name="code" dir="ltr" defaultValue={collection.code} required pattern="[A-Z0-9-]{2,12}"/></label>
      <div className={styles.actions}><button disabled={Boolean(busy)}>ذخیره</button><button type="button" className={styles.delete} disabled={Boolean(busy)||count>0} onClick={()=>remove(collection)}>حذف</button></div>
    </form>;})}{collections.length===0&&<div className={styles.empty}>هنوز کالکشنی ساخته نشده است.</div>}</div>
  </section>;
}
