'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProductLifecyclePanel.module.css';

type Lifecycle={id:string;nameFa:string;status:string;isVisible:boolean};

async function request(path:string,method:'GET'|'PATCH'|'DELETE',payload?:Record<string,unknown>){
  const response=await fetch('/api/admin/'+path,{method,headers:payload?{'content-type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined,cache:'no-store'});
  const raw=await response.text();
  if(!response.ok){
    try{const parsed=JSON.parse(raw);throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));}
    catch(error){if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;throw new Error(raw||`HTTP ${response.status}`);}
  }
  return raw?JSON.parse(raw):null;
}

export default function ProductLifecyclePanel({productId,name,status}:{productId:string;name:string;status:string}){
  const router=useRouter();
  const [item,setItem]=useState<Lifecycle|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{let active=true;void request('product-lifecycle','GET').then((items:Lifecycle[])=>{if(active)setItem(items.find(entry=>entry.id===productId)??null);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'وضعیت نمایش محصول دریافت نشد.');});return()=>{active=false;};},[productId]);

  async function toggleVisibility(){
    if(!item||busy)return;
    const nextVisible=!item.isVisible;
    const restoring=nextVisible&&item.status==='ARCHIVED';
    if(restoring&&!window.confirm(`محصول «${name}» آرشیو است.\nبا روشن کردن نمایش، محصول از آرشیو خارج و دوباره فعال می‌شود. ادامه می‌دهی؟`))return;
    setBusy(true);setMessage('');setError('');
    try{
      const updated=await request(`product-lifecycle/${productId}`,'PATCH',{isVisible:nextVisible}) as Lifecycle;
      setItem(updated);
      setMessage(restoring?'محصول از آرشیو خارج شد و دوباره در سایت نمایش داده می‌شود.':updated.isVisible?'محصول در سایت نمایش داده می‌شود.':'نمایش محصول در سایت غیرفعال شد.');
      window.dispatchEvent(new Event('eva-admin-catalog-change'));router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:'تغییر نمایش محصول انجام نشد.');}
    finally{setBusy(false);}
  }

  async function archive(){if(busy)return;if(!window.confirm(`محصول «${name}» آرشیو و از سایت مخفی شود؟\nاطلاعات و سابقه محصول حفظ می‌شود.`))return;setBusy(true);setMessage('');setError('');try{const updated=await request(`product-lifecycle/${productId}`,'PATCH',{archive:true}) as Lifecycle;setItem(updated);setMessage('محصول آرشیو شد و دیگر در سایت نمایش داده نمی‌شود.');window.dispatchEvent(new Event('eva-admin-catalog-change'));router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'آرشیو محصول انجام نشد.');}finally{setBusy(false);}}

  async function restore(){if(!item||busy||item.status!=='ARCHIVED')return;if(!window.confirm(`محصول «${name}» از آرشیو خارج و دوباره فعال و قابل نمایش شود؟`))return;setBusy(true);setMessage('');setError('');try{const updated=await request(`product-lifecycle/${productId}`,'PATCH',{restore:true}) as Lifecycle;setItem(updated);setMessage('محصول از آرشیو خارج شد، فعال شد و دوباره در سایت نمایش داده می‌شود.');window.dispatchEvent(new Event('eva-admin-catalog-change'));router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'بازگردانی محصول انجام نشد.');}finally{setBusy(false);}}

  async function remove(){if(busy)return;if(!window.confirm(`محصول «${name}» برای همیشه حذف شود؟\nاگر سابقه فروش، رزرو یا خدمات پس از فروش داشته باشد سیستم اجازه حذف نمی‌دهد.`))return;setBusy(true);setMessage('');setError('');try{await request(`product-lifecycle/${productId}`,'DELETE');window.dispatchEvent(new Event('eva-admin-catalog-change'));router.push('/catalog');router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'حذف محصول انجام نشد. اگر محصول سابقه دارد، آن را آرشیو کن.');setBusy(false);}}

  const visible=item?.isVisible??null;
  const currentStatus=item?.status??status;
  const isArchived=currentStatus==='ARCHIVED';
  return <section className={styles.panel} dir="rtl">
    <div className={styles.summary}>
      <div><span>نمایش در فروشگاه</span><strong>{visible===null?'در حال بررسی…':visible?'نمایش داده می‌شود':'عدم نمایش'}</strong><small>{isArchived?'این محصول آرشیو است؛ برای نمایش باید از آرشیو خارج شود.':'این گزینه مستقل از وضعیت‌های عادی محصول است.'}</small></div>
      <button type="button" className={`${styles.switch} ${visible?styles.on:''}`} onClick={toggleVisibility} disabled={busy||visible===null} aria-pressed={Boolean(visible)}><i/><span>{visible?'نمایش روشن':'نمایش خاموش'}</span></button>
    </div>
    <div className={styles.policy}><span>وضعیت فعلی: <b>{currentStatus}</b></span><p>{isArchived?'محصول آرشیوی در همان لیست محصولات باقی می‌ماند و از فیلتر «وضعیت ← آرشیو» قابل پیدا کردن و بازگردانی است.':'محصول بدون سابقه فروش/رزرو قابل حذف دائمی است. محصول دارای سابقه باید آرشیو شود تا اطلاعات سفارش‌ها حفظ شود.'}</p></div>
    <div className={styles.actions}>{isArchived?<button type="button" onClick={restore} disabled={busy} className={styles.archive}>بازگردانی از آرشیو + نمایش در سایت</button>:<button type="button" onClick={archive} disabled={busy} className={styles.archive}>آرشیو + عدم نمایش</button>}<button type="button" onClick={remove} disabled={busy} className={styles.delete}>حذف دائمی محصول</button></div>
    {(message||error)&&<div className={error?styles.error:styles.success}>{error||message}</div>}
  </section>;
}
