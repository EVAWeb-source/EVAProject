'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CustomerNoteEditor.module.css';

export default function CustomerNoteEditor({id,name,internalNote}:{id:string;name:string|null;internalNote:string|null}){
  const router=useRouter();
  const [customerName,setCustomerName]=useState(name??'');
  const [note,setNote]=useState(internalNote??'');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  async function save(){
    if(busy)return;
    setBusy(true);setMessage('');setError('');
    try{
      const response=await fetch(`/api/admin/customers/${encodeURIComponent(id)}`,{
        method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({name:customerName,internalNote:note}),
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(typeof body?.message==='string'?body.message:'ذخیره اطلاعات مشتری انجام نشد.');
      setMessage('اطلاعات مشتری ذخیره شد.');
      router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:'ذخیره اطلاعات مشتری انجام نشد.');}
    finally{setBusy(false);}
  }

  return <section className={styles.card}>
    <div className={styles.head}><span>INTERNAL PROFILE</span><h2>یادداشت داخلی</h2><p>این اطلاعات فقط در پنل مدیریت دیده می‌شود و برای مشتری نمایش داده نمی‌شود.</p></div>
    <label>نام نمایشی<input value={customerName} onChange={(e)=>setCustomerName(e.target.value)} maxLength={120}/></label>
    <label>یادداشت<textarea value={note} onChange={(e)=>setNote(e.target.value)} maxLength={3000} rows={6} placeholder="مثلاً ترجیح بسته‌بندی، سابقه تماس یا نکته خدماتی..."/></label>
    {message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}
    <button onClick={save} disabled={busy}>{busy?'در حال ذخیره...':'ذخیره پروفایل'}</button>
  </section>;
}
