'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductContentPanel from './ProductContentPanel';
import styles from './ProductEditor.module.css';

type Collection={id:string;nameFa:string;slug:string;code:string};
type Unit={id:string;unitSku:string;exactWeightGram:string;currentPriceToman:number|null;status:string;reservedUntil:string|null};
type Product={id:string;nameFa:string;slug:string;masterSku:string;purity:number;status:string;collectionId:string|null;collection:string|null;unitCount:number;availableCount:number;units?:Unit[]};
type Readiness={completedSteps:number;totalSteps:number;readyToPublish:boolean;missing:string[]}|null;

const statuses=[['DRAFT','پیش‌نویس'],['ACTIVE','فعال'],['OUT_OF_STOCK','ناموجود'],['HIDDEN','مخفی'],['DISCONTINUED','توقف عرضه'],['ARCHIVED','آرشیو']];
const unitStatuses=[['QC_PENDING','در انتظار QC'],['AVAILABLE','موجود'],['QUALITY_HOLD','توقف QC'],['DAMAGED','آسیب‌دیده'],['UNAVAILABLE','غیرقابل فروش']];

async function request(path:string,method:'POST'|'PATCH',payload?:Record<string,unknown>){
  const response=await fetch('/api/admin/'+path,{method,headers:payload?{'content-type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined});
  const raw=await response.text();
  if(!response.ok){
    try{const parsed=JSON.parse(raw);throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));}
    catch(error){if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;throw new Error(raw||`HTTP ${response.status}`);}
  }
  return raw?JSON.parse(raw):null;
}

export default function ProductEditor({product,collections,readiness}:{product:Product;collections:Collection[];readiness:Readiness}){
  const router=useRouter();
  const [tab,setTab]=useState<'BASICS'|'CONTENT'|'UNITS'|'PUBLISH'>('BASICS');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  async function saveBasics(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');setError('');
    const data=new FormData(event.currentTarget);
    const nextStatus=String(data.get('status')??product.status);
    if(nextStatus==='ACTIVE'&&product.status!=='ACTIVE'){
      setBusy(false);setError('فعال‌سازی محصول فقط از تب «انتشار» و پس از تکمیل Readiness انجام می‌شود.');return;
    }
    try{
      await request(`products/${product.id}`,'PATCH',{nameFa:data.get('nameFa'),status:nextStatus,collectionId:data.get('collectionId')||null});
      setMessage('اطلاعات اصلی محصول ذخیره شد.');router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:'ذخیره انجام نشد.');}
    finally{setBusy(false);}
  }

  async function createUnit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');setError('');
    const form=event.currentTarget;const data=new FormData(form);
    try{
      await request('units','POST',{productId:product.id,unitSku:data.get('unitSku'),exactWeightGram:data.get('exactWeightGram'),status:data.get('status')||'QC_PENDING'});
      form.reset();setMessage('Unit جدید ساخته شد.');window.dispatchEvent(new Event('eva-admin-catalog-change'));router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:'ساخت Unit انجام نشد.');}
    finally{setBusy(false);}
  }

  async function publish(){
    setBusy(true);setMessage('');setError('');
    try{await request(`catalog-readiness/${product.id}/publish`,'PATCH');setMessage('محصول منتشر شد و وارد کاتالوگ فروش شد.');router.refresh();}
    catch(cause){setError(cause instanceof Error?cause.message:'انتشار انجام نشد.');}
    finally{setBusy(false);}
  }

  return <div className={styles.editor}>
    <nav className={styles.tabs}>
      <button className={tab==='BASICS'?styles.active:''} onClick={()=>setTab('BASICS')}>اطلاعات اصلی</button>
      <button className={tab==='CONTENT'?styles.active:''} onClick={()=>setTab('CONTENT')}>محتوا و تصاویر</button>
      <button className={tab==='UNITS'?styles.active:''} onClick={()=>setTab('UNITS')}>Unitها <small>{product.unitCount}</small></button>
      <button className={tab==='PUBLISH'?styles.active:''} onClick={()=>setTab('PUBLISH')}>انتشار</button>
    </nav>

    {(message||error)&&<div className={error?styles.error:styles.success}>{error||message}</div>}

    {tab==='BASICS'&&<section className={styles.card}>
      <div className={styles.sectionHead}><div><span>MASTER PRODUCT</span><h2>اطلاعات اصلی</h2></div><small dir="ltr">{product.masterSku}</small></div>
      <form className={styles.form} onSubmit={saveBasics}>
        <div className={styles.grid2}><label>نام فارسی<input name="nameFa" defaultValue={product.nameFa}/></label><label>Slug<input dir="ltr" value={product.slug} disabled/></label></div>
        <div className={styles.grid2}><label>کالکشن<select name="collectionId" defaultValue={product.collectionId??''}><option value="">بدون کالکشن</option>{collections.map(c=><option key={c.id} value={c.id}>{c.nameFa}</option>)}</select></label><label>وضعیت<select name="status" defaultValue={product.status}>{statuses.filter(([value])=>value!=='ACTIVE'||product.status==='ACTIVE').map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
        <div className={styles.readonly}><div><span>Master SKU</span><strong dir="ltr">{product.masterSku}</strong></div><div><span>عیار</span><strong>{product.purity}</strong></div><div><span>Unit موجود</span><strong>{product.availableCount}</strong></div></div>
        <button className={styles.primary} disabled={busy}>{busy?'در حال ذخیره...':'ذخیره اطلاعات اصلی'}</button>
      </form>
    </section>}

    {tab==='CONTENT'&&<ProductContentPanel products={[{id:product.id,nameFa:product.nameFa,masterSku:product.masterSku}]} initialProductId={product.id} hideSelector/>}

    {tab==='UNITS'&&<section className={styles.card}>
      <div className={styles.sectionHead}><div><span>PHYSICAL INVENTORY</span><h2>Unitهای این محصول</h2></div><a href="/inventory">همه موجودی‌ها</a></div>
      <form className={styles.unitForm} onSubmit={createUnit}>
        <label>Unit SKU<input name="unitSku" dir="ltr" required placeholder={`${product.masterSku}-U01`}/></label>
        <label>وزن دقیق (گرم)<input name="exactWeightGram" type="number" step="0.001" min="0.001" required placeholder="0.820"/></label>
        <label>وضعیت<select name="status" defaultValue="QC_PENDING">{unitStatuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <button disabled={busy}>+ ساخت Unit</button>
      </form>
      <div className={styles.unitList}>{(product.units??[]).map(unit=><div key={unit.id} className={styles.unitRow}><div><strong dir="ltr">{unit.unitSku}</strong><small>{unit.exactWeightGram} گرم</small></div><span className={`badge ${unit.status.toLowerCase()}`}>{unit.status}</span><strong>{unit.currentPriceToman===null?'—':new Intl.NumberFormat('fa-IR').format(unit.currentPriceToman)+' تومان'}</strong></div>)}{(product.units?.length??0)===0&&<div className={styles.empty}>هنوز Unitی برای این محصول ثبت نشده است.</div>}</div>
    </section>}

    {tab==='PUBLISH'&&<section className={styles.card}>
      <div className={styles.sectionHead}><div><span>PUBLICATION GATE</span><h2>آمادگی انتشار</h2></div><span className={product.status==='ACTIVE'?styles.live:styles.draft}>{product.status==='ACTIVE'?'LIVE':'DRAFT'}</span></div>
      <div className={styles.publishBox}>
        <div className={styles.score}><strong>{readiness?`${readiness.completedSteps}/${readiness.totalSteps}`:'—'}</strong><span>مراحل تکمیل‌شده</span></div>
        <div className={styles.missing}><strong>{readiness?.readyToPublish?'محصول آماده Publish است.':'موارد باقیمانده'}</strong>{readiness?.missing?.length?<ul>{readiness.missing.map(item=><li key={item}>{item}</li>)}</ul>:<p>همه Gateها تکمیل شده‌اند.</p>}</div>
      </div>
      {product.status!=='ACTIVE'&&<button className={styles.publish} disabled={busy||!readiness?.readyToPublish} onClick={publish}>{busy?'در حال انتشار...':'Publish محصول'}</button>}
      {product.status==='ACTIVE'&&<p className={styles.liveNote}>این محصول در Storefront فعال است. برای توقف نمایش، از تب اطلاعات اصلی وضعیت را به «مخفی» یا «ناموجود» تغییر بده.</p>}
    </section>}
  </div>;
}
