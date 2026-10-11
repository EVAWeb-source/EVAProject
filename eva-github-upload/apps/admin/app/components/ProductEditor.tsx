'use client';

import { FormEvent, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductContentPanel from './ProductContentPanel';
import styles from './ProductEditor.module.css';

type Collection={id:string;nameFa:string;slug:string;code:string};
type Unit={id:string;unitSku:string;exactWeightGram:string;currentPriceToman:number|null;status:string;reservedUntil:string|null};
type Product={id:string;nameFa:string;slug:string;masterSku:string;purity:number;status:string;collectionId:string|null;collection:string|null;unitCount:number;availableCount:number;units?:Unit[]};
type Readiness={completedSteps:number;totalSteps:number;readyToPublish:boolean;missing:string[]}|null;

const statuses=[['DRAFT','پیش‌نویس'],['ACTIVE','فعال'],['OUT_OF_STOCK','ناموجود'],['HIDDEN','مخفی'],['DISCONTINUED','توقف عرضه'],['ARCHIVED','آرشیو']];
const unitStatuses=[['QC_PENDING','در انتظار QC'],['AVAILABLE','موجود'],['QUALITY_HOLD','توقف QC'],['DAMAGED','آسیب‌دیده'],['UNAVAILABLE','غیرقابل فروش']];
const unitStatusLabel=Object.fromEntries(unitStatuses);

function RequiredLabel({children}:{children:ReactNode}){
  return <span className={styles.requiredLabel}>{children}<b aria-hidden="true">*</b></span>;
}

async function request(path:string,method:'POST'|'PATCH'|'DELETE',payload?:Record<string,unknown>){
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
  const identityLocked=product.unitCount>0;

  function begin(){setBusy(true);setMessage('');setError('');}
  function fail(cause:unknown,fallback:string){setError(cause instanceof Error?cause.message:fallback);}

  async function saveBasics(event:FormEvent<HTMLFormElement>){
    event.preventDefault();begin();
    const data=new FormData(event.currentTarget);
    const nextStatus=String(data.get('status')??product.status);
    if(nextStatus==='ACTIVE'&&product.status!=='ACTIVE'){
      setBusy(false);setError('فعال‌سازی محصول فقط از تب «انتشار» و پس از تکمیل Readiness انجام می‌شود.');return;
    }
    const payload:Record<string,unknown>={
      nameFa:data.get('nameFa'),
      slug:data.get('slug'),
      status:nextStatus,
      collectionId:data.get('collectionId')||null,
    };
    if(!identityLocked){
      payload.masterSku=data.get('masterSku');
      payload.purity=Number(data.get('purity')??product.purity);
    }
    try{
      await request(`products/${product.id}`,'PATCH',payload);
      setMessage('اطلاعات اصلی محصول ذخیره شد.');router.refresh();
    }catch(cause){fail(cause,'ذخیره انجام نشد.');}
    finally{setBusy(false);}
  }

  async function createUnit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();begin();
    const form=event.currentTarget;const data=new FormData(form);
    try{
      await request('units','POST',{productId:product.id,unitSku:data.get('unitSku'),exactWeightGram:data.get('exactWeightGram'),status:data.get('status')||'QC_PENDING'});
      form.reset();setMessage('Unit جدید ساخته شد.');window.dispatchEvent(new Event('eva-admin-catalog-change'));router.refresh();
    }catch(cause){fail(cause,'ساخت Unit انجام نشد.');}
    finally{setBusy(false);}
  }

  async function saveUnit(event:FormEvent<HTMLFormElement>,unit:Unit){
    event.preventDefault();begin();
    const data=new FormData(event.currentTarget);
    try{
      await request(`units/${unit.id}`,'PATCH',{exactWeightGram:Number(data.get('exactWeightGram')),status:data.get('status')});
      setMessage(`Unit ${unit.unitSku} بروزرسانی شد.`);window.dispatchEvent(new Event('eva-admin-catalog-change'));router.refresh();
    }catch(cause){fail(cause,'بروزرسانی Unit انجام نشد.');}
    finally{setBusy(false);}
  }

  async function deleteUnit(unit:Unit){
    if(!window.confirm(`Unit ${unit.unitSku} حذف شود؟\nاگر سابقه سفارش یا رزرو داشته باشد سیستم اجازه حذف نمی‌دهد.`))return;
    begin();
    try{
      await request(`units/${unit.id}`,'DELETE');
      setMessage(`Unit ${unit.unitSku} حذف شد.`);window.dispatchEvent(new Event('eva-admin-catalog-change'));router.refresh();
    }catch(cause){fail(cause,'حذف Unit انجام نشد.');}
    finally{setBusy(false);}
  }

  async function deleteProduct(){
    if(product.status==='ACTIVE'){
      setError('برای حذف کامل، ابتدا وضعیت محصول را از «فعال» به مخفی یا آرشیو تغییر بده.');return;
    }
    const confirmed=window.confirm(`محصول «${product.nameFa}» برای همیشه حذف شود؟\nفقط محصولی بدون سابقه سفارش/رزرو قابل حذف است.`);
    if(!confirmed)return;
    begin();
    try{
      await request(`products/${product.id}`,'DELETE');
      window.dispatchEvent(new Event('eva-admin-catalog-change'));
      router.push('/catalog');router.refresh();
    }catch(cause){fail(cause,'حذف محصول انجام نشد.');setBusy(false);}
  }

  async function publish(){
    begin();
    try{await request(`catalog-readiness/${product.id}/publish`,'PATCH');setMessage('محصول منتشر شد و وارد کاتالوگ فروش شد.');router.refresh();}
    catch(cause){fail(cause,'انتشار انجام نشد.');}
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

    {tab==='BASICS'&&<>
      <section className={styles.card}>
        <div className={styles.sectionHead}><div><span>MASTER PRODUCT</span><h2>اطلاعات اصلی</h2></div><small dir="ltr">{product.masterSku}</small></div>
        <form className={styles.form} onSubmit={saveBasics}>
          <div className={styles.requiredNote}><b>*</b><span>الزامی برای انتشار محصول</span></div>
          <div className={styles.grid2}><label><RequiredLabel>نام فارسی</RequiredLabel><input name="nameFa" defaultValue={product.nameFa} required/></label><label><RequiredLabel>Slug</RequiredLabel><input name="slug" dir="ltr" defaultValue={product.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*"/></label></div>
          <div className={styles.grid2}><label><RequiredLabel>Master SKU</RequiredLabel><input name="masterSku" dir="ltr" defaultValue={product.masterSku} disabled={identityLocked}/><small>{identityLocked?'بعد از ساخت Unit قفل می‌شود.':'تا قبل از ساخت Unit قابل ویرایش است.'}</small></label><label><RequiredLabel>عیار</RequiredLabel><input name="purity" type="number" min="1" max="24" step="1" defaultValue={product.purity} disabled={identityLocked}/><small>{identityLocked?'بعد از ساخت Unit قفل می‌شود.':'عیار Master Product'}</small></label></div>
          <div className={styles.grid2}><label><RequiredLabel>کالکشن</RequiredLabel><select name="collectionId" defaultValue={product.collectionId??''}><option value="">بدون کالکشن</option>{collections.map(c=><option key={c.id} value={c.id}>{c.nameFa}</option>)}</select><small>برای Publish باید کالکشن انتخاب شده باشد.</small></label><label>وضعیت<select name="status" defaultValue={product.status}>{statuses.filter(([value])=>value!=='ACTIVE'||product.status==='ACTIVE').map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
          <div className={styles.readonly}><div><span>Master SKU</span><strong dir="ltr">{product.masterSku}</strong></div><div><span>عیار</span><strong>{product.purity}</strong></div><div><span>Unit موجود</span><strong>{product.availableCount}</strong></div></div>
          <button className={styles.primary} disabled={busy}>{busy?'در حال ذخیره...':'ذخیره اطلاعات اصلی'}</button>
        </form>
      </section>
      <section className={styles.dangerZone}>
        <div><span>DANGER ZONE</span><h3>حذف دائمی محصول</h3><p>اگر محصول یا Unitهایش سابقه سفارش، رزرو یا After Sales داشته باشند حذف دائمی مسدود می‌شود. برای نگهداری تاریخچه از «آرشیو» استفاده کن.</p></div>
        <button disabled={busy||product.status==='ACTIVE'} onClick={deleteProduct}>حذف دائمی محصول</button>
      </section>
    </>}

    {tab==='CONTENT'&&<ProductContentPanel products={[{id:product.id,nameFa:product.nameFa,masterSku:product.masterSku}]} initialProductId={product.id} hideSelector/>}

    {tab==='UNITS'&&<section className={styles.card}>
      <div className={styles.sectionHead}><div><span>PHYSICAL INVENTORY</span><h2>Unitهای این محصول</h2></div><a href="/inventory">همه موجودی‌ها</a></div>
      <div className={styles.unitRequirement}><b>*</b><span>برای انتشار، حداقل یک Unit باید با وضعیت «موجود» ثبت شده باشد.</span></div>
      <form className={styles.unitForm} onSubmit={createUnit}>
        <label><RequiredLabel>Unit SKU</RequiredLabel><input name="unitSku" dir="ltr" required placeholder={`${product.masterSku}-U01`}/></label>
        <label><RequiredLabel>وزن دقیق (گرم)</RequiredLabel><input name="exactWeightGram" type="number" step="0.001" min="0.001" required placeholder="0.820"/></label>
        <label><RequiredLabel>وضعیت</RequiredLabel><select name="status" defaultValue="QC_PENDING">{unitStatuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <button disabled={busy}>+ ساخت Unit</button>
      </form>
      <div className={styles.unitList}>{(product.units??[]).map(unit=><form key={unit.id} className={styles.unitRow} onSubmit={event=>saveUnit(event,unit)}>
        <div><strong dir="ltr">{unit.unitSku}</strong><small>{unit.currentPriceToman===null?'قیمت پس از Quote محاسبه می‌شود':new Intl.NumberFormat('fa-IR').format(unit.currentPriceToman)+' تومان'}</small></div>
        <label><span>وزن</span><input name="exactWeightGram" type="number" step="0.001" min="0.001" defaultValue={unit.exactWeightGram} disabled={['RESERVED','SOLD','RETURNED'].includes(unit.status)}/></label>
        <label><span>وضعیت</span><select name="status" defaultValue={unit.status} disabled={['RESERVED','SOLD','RETURNED'].includes(unit.status)}>{unitStatuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><small>{unitStatusLabel[unit.status]??unit.status}</small></label>
        <div className={styles.unitActions}><button type="submit" disabled={busy||['RESERVED','SOLD','RETURNED'].includes(unit.status)}>ذخیره</button><button type="button" className={styles.deleteUnit} disabled={busy||['RESERVED','SOLD','RETURNED'].includes(unit.status)} onClick={()=>deleteUnit(unit)}>حذف</button></div>
      </form>)}{(product.units?.length??0)===0&&<div className={styles.empty}>هنوز Unitی برای این محصول ثبت نشده است.</div>}</div>
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
