'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductContentPanel from './ProductContentPanel';
import styles from './ProductEditor.module.css';

type Collection={id:string;nameFa:string;slug:string;code:string};
type Unit={id:string;unitSku:string;exactWeightGram:string;currentPriceToman:number|null;status:string;reservedUntil:string|null};
type Product={id:string;nameFa:string;slug:string;masterSku:string;purity:number;status:string;collectionId:string|null;collection:string|null;unitCount:number;availableCount:number;units?:Unit[]};
type Readiness={completedSteps:number;totalSteps:number;readyToPublish:boolean;missing:string[]}|null;
type Tab='BASICS'|'CONTENT'|'UNITS'|'PUBLISH';

const statuses=[['DRAFT','پیش‌نویس'],['ACTIVE','فعال'],['OUT_OF_STOCK','ناموجود'],['HIDDEN','مخفی'],['DISCONTINUED','توقف عرضه'],['ARCHIVED','آرشیو']];
const unitStatuses=[['QC_PENDING','در انتظار QC'],['AVAILABLE','موجود'],['QUALITY_HOLD','توقف QC'],['DAMAGED','آسیب‌دیده'],['UNAVAILABLE','غیرقابل فروش']];
const unitStatusLabel=Object.fromEntries(unitStatuses);
const categories=[['NEC','گردنبند'],['PEN','آویز'],['BRA','دستبند'],['RIN','انگشتر'],['EAR','گوشواره'],['SET','ست'],['ANK','پابند'],['CHM','چارم']] as const;
const wizardSteps:Array<{id:Tab;label:string;hint:string}>=[
  {id:'BASICS',label:'اطلاعات اصلی',hint:'هویت محصول'},
  {id:'CONTENT',label:'محتوا و تصاویر',hint:'متن، تصویر و SEO'},
  {id:'UNITS',label:'Unit و موجودی',hint:'قطعه فیزیکی'},
  {id:'PUBLISH',label:'انتشار',hint:'بررسی نهایی'},
];

function RequiredLabel({children}:{children:ReactNode}){return <span className={styles.requiredLabel}>{children}<b aria-hidden="true">*</b></span>;}
function categoryFromSku(masterSku:string){return masterSku.trim().toUpperCase().split('-')[2]??'';}
function withCategoryCode(masterSku:string,categoryCode:string){const parts=masterSku.trim().toUpperCase().split('-').filter(Boolean);if(parts.length>=3){parts[2]=categoryCode;return parts.join('-');}return masterSku.trim().toUpperCase();}
function slugToken(slug:string){const clean=slug.replace(/[^a-z0-9]/gi,'').toUpperCase();return (clean.slice(0,3)||'PRD').padEnd(3,'X');}
function buildSuggestedSku(collections:Collection[],collectionId:string,categoryCode:string,slug:string,currentSku:string){const collectionCode=collections.find(c=>c.id===collectionId)?.code??'GEN';const serial=currentSku.match(/-(\d{3,})$/)?.[1]??'001';return `EVA-${collectionCode.toUpperCase()}-${categoryCode||'CAT'}-${slugToken(slug)}-${serial}`;}
function nextUnitSku(masterSku:string,units:Unit[]=[]){const max=units.reduce((value,unit)=>{const match=unit.unitSku.match(/-U(\d+)$/);return match?Math.max(value,Number(match[1])):value;},0);return `${masterSku}-U${String(max+1).padStart(2,'0')}`;}
function validUnitSku(masterSku:string,unitSku:string){return unitSku.startsWith(`${masterSku}-U`)&&new RegExp(`^${masterSku.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}-U\\d{2,}$`).test(unitSku);}

async function request(path:string,method:'POST'|'PATCH'|'DELETE',payload?:Record<string,unknown>){
  const response=await fetch('/api/admin/'+path,{method,headers:payload?{'content-type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined});
  const raw=await response.text();
  if(!response.ok){try{const parsed=JSON.parse(raw);throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));}catch(error){if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;throw new Error(raw||`HTTP ${response.status}`);}}
  return raw?JSON.parse(raw):null;
}

export default function ProductEditor({product,collections,readiness}:{product:Product;collections:Collection[];readiness:Readiness}){
  const router=useRouter();
  const [tab,setTab]=useState<Tab>('BASICS');
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
  const [categoryCode,setCategoryCode]=useState(categoryFromSku(product.masterSku));
  const [slug,setSlug]=useState(product.slug);
  const [collectionId,setCollectionId]=useState(product.collectionId??'');
  const [masterSku,setMasterSku]=useState(product.masterSku);
  const [unitSku,setUnitSku]=useState(nextUnitSku(product.masterSku,product.units));
  const identityLocked=product.unitCount>0;
  const knownCategory=categories.some(([value])=>value===categoryCode);
  const skuCategoryValid=!categoryCode||categoryFromSku(masterSku)===categoryCode;
  const unitSkuValid=validUnitSku(product.masterSku,unitSku);
  const currentIndex=wizardSteps.findIndex(step=>step.id===tab);

  useEffect(()=>{
    const requested=new URLSearchParams(window.location.search).get('step') as Tab|null;
    if(requested&&wizardSteps.some(step=>step.id===requested))setTab(requested);
  },[]);

  function goTo(next:Tab){
    setTab(next);setMessage('');setError('');
    const url=new URL(window.location.href);url.searchParams.set('step',next);window.history.replaceState({},'',url.pathname+url.search);
    window.scrollTo({top:0,behavior:'auto'});
  }
  function begin(){setBusy(true);setMessage('');setError('');}
  function fail(cause:unknown,fallback:string){setError(cause instanceof Error?cause.message:fallback);}
  function changeCategory(next:string){setCategoryCode(next);if(!identityLocked&&next)setMasterSku(current=>withCategoryCode(current,next));}
  function autoMasterSku(){if(identityLocked)return;setMasterSku(buildSuggestedSku(collections,collectionId,categoryCode,slug,masterSku));}

  async function saveBasics(event:FormEvent<HTMLFormElement>){
    event.preventDefault();begin();
    const data=new FormData(event.currentTarget);const nextStatus=String(data.get('status')??product.status);
    if(nextStatus==='ACTIVE'&&product.status!=='ACTIVE'){setBusy(false);setError('فعال‌سازی محصول فقط از مرحله «انتشار» و پس از تکمیل Readiness انجام می‌شود.');return;}
    if(!categoryCode){setBusy(false);setError('دسته‌بندی محصول را انتخاب کن.');return;}
    if(!skuCategoryValid){setBusy(false);setError(`کد دسته‌بندی داخل Master SKU باید ${categoryCode} باشد.`);return;}
    const payload:Record<string,unknown>={nameFa:data.get('nameFa'),slug,status:nextStatus,collectionId:collectionId||null,categoryCode};
    if(!identityLocked){payload.masterSku=masterSku.trim().toUpperCase();payload.purity=Number(data.get('purity')??product.purity);}
    try{await request(`products/${product.id}`,'PATCH',payload);goTo('CONTENT');setMessage('اطلاعات اصلی ذخیره شد؛ مرحله بعد محتوا و تصاویر است.');router.refresh();}
    catch(cause){fail(cause,'ذخیره انجام نشد.');}finally{setBusy(false);}
  }

  async function createUnit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!unitSkuValid){setError(`Unit SKU باید دقیقاً با ${product.masterSku}-U شروع شود و فقط شماره Unit در انتها تغییر کند.`);return;}
    begin();const form=event.currentTarget;const data=new FormData(form);
    try{
      await request('units','POST',{productId:product.id,unitSku:unitSku.trim().toUpperCase(),exactWeightGram:data.get('exactWeightGram'),status:data.get('status')||'QC_PENDING'});
      const currentNumber=Number(unitSku.match(/-U(\d+)$/)?.[1]??0);setUnitSku(`${product.masterSku}-U${String(currentNumber+1).padStart(2,'0')}`);
      form.reset();setMessage('Unit جدید ساخته شد؛ در صورت نیاز Unit بعدی را اضافه کن یا به مرحله انتشار برو.');window.dispatchEvent(new Event('eva-admin-catalog-change'));router.refresh();
    }catch(cause){fail(cause,'ساخت Unit انجام نشد.');}finally{setBusy(false);}
  }

  async function saveUnit(event:FormEvent<HTMLFormElement>,unit:Unit){event.preventDefault();begin();const data=new FormData(event.currentTarget);try{await request(`units/${unit.id}`,'PATCH',{exactWeightGram:Number(data.get('exactWeightGram')),status:data.get('status')});setMessage(`Unit ${unit.unitSku} بروزرسانی شد.`);window.dispatchEvent(new Event('eva-admin-catalog-change'));router.refresh();}catch(cause){fail(cause,'بروزرسانی Unit انجام نشد.');}finally{setBusy(false);}}
  async function deleteUnit(unit:Unit){if(!window.confirm(`Unit ${unit.unitSku} حذف شود؟\nاگر سابقه سفارش یا رزرو داشته باشد سیستم اجازه حذف نمی‌دهد.`))return;begin();try{await request(`units/${unit.id}`,'DELETE');setMessage(`Unit ${unit.unitSku} حذف شد.`);window.dispatchEvent(new Event('eva-admin-catalog-change'));router.refresh();}catch(cause){fail(cause,'حذف Unit انجام نشد.');}finally{setBusy(false);}}
  async function deleteProduct(){if(product.status==='ACTIVE'){setError('برای حذف کامل، ابتدا وضعیت محصول را از «فعال» به مخفی یا آرشیو تغییر بده.');return;}if(!window.confirm(`محصول «${product.nameFa}» برای همیشه حذف شود؟\nفقط محصولی بدون سابقه سفارش/رزرو قابل حذف است.`))return;begin();try{await request(`products/${product.id}`,'DELETE');window.dispatchEvent(new Event('eva-admin-catalog-change'));router.push('/catalog');router.refresh();}catch(cause){fail(cause,'حذف محصول انجام نشد.');setBusy(false);}}
  async function publish(){begin();try{await request(`catalog-readiness/${product.id}/publish`,'PATCH');setMessage('محصول منتشر شد و وارد کاتالوگ فروش شد.');router.refresh();}catch(cause){fail(cause,'انتشار انجام نشد.');}finally{setBusy(false);}}

  return <div className={styles.editor}>
    <div className={styles.stepperWrap}><nav className={styles.stepper} aria-label="مراحل ساخت محصول">{wizardSteps.map((step,index)=>{const active=step.id===tab;const passed=index<currentIndex||product.status==='ACTIVE';return <button key={step.id} type="button" className={`${styles.step} ${active?styles.stepActive:''} ${passed?styles.stepPassed:''}`} onClick={()=>goTo(step.id)} aria-current={active?'step':undefined}><span className={styles.stepNumber}>{passed?'✓':index+1}</span><span className={styles.stepText}><strong>{step.label}</strong><small>{active?'مرحله فعلی':passed?'انجام‌شده':step.hint}</small></span></button>;})}</nav></div>
    {(message||error)&&<div className={error?styles.error:styles.success}>{error||message}</div>}

    {tab==='BASICS'&&<><section className={styles.card}>
      <div className={styles.sectionHead}><div><span>مرحله ۱ از ۴</span><h2>اطلاعات اصلی</h2></div><small dir="ltr">{product.masterSku}</small></div>
      <form className={styles.form} onSubmit={saveBasics}>
        <div className={styles.requiredNote}><b>*</b><span>الزامی برای انتشار محصول</span></div>
        <div className={styles.grid2}><label><RequiredLabel>نام فارسی</RequiredLabel><input name="nameFa" defaultValue={product.nameFa} required/></label><label><RequiredLabel>Slug</RequiredLabel><input name="slug" dir="ltr" value={slug} onChange={event=>setSlug(event.target.value.toLowerCase())} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*"/></label></div>
        <div className={styles.grid2}>
          <label><RequiredLabel>دسته‌بندی</RequiredLabel><select name="categoryCode" value={categoryCode} onChange={event=>changeCategory(event.target.value)} disabled={identityLocked} required>{!knownCategory&&categoryCode&&<option value={categoryCode}>نامشخص ({categoryCode})</option>}<option value="">انتخاب دسته‌بندی</option>{categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><small>{identityLocked?'بعد از ساخت Unit همراه با هویت محصول قفل می‌شود.':'با تغییر دسته، کد دسته در SKU هم خودکار هماهنگ می‌شود.'}</small></label>
          <label><RequiredLabel>عیار</RequiredLabel><input name="purity" type="number" min="1" max="24" step="1" defaultValue={product.purity} disabled={identityLocked}/><small>{identityLocked?'بعد از ساخت Unit قفل می‌شود.':'عیار Master Product'}</small></label>
        </div>
        <div className={styles.grid2}>
          <label><RequiredLabel>Master SKU</RequiredLabel><div className={styles.skuLine}><input name="masterSku" dir="ltr" value={masterSku} aria-invalid={!skuCategoryValid} onChange={event=>setMasterSku(event.target.value.toUpperCase())} disabled={identityLocked}/>{!identityLocked&&<button type="button" className={styles.autoSku} onClick={autoMasterSku}>پیشنهاد خودکار</button>}</div><small>{identityLocked?'بعد از ساخت Unit قفل می‌شود.':'قابل ویرایش است، اما کد دسته‌بندی باید با فیلد دسته یکی باشد.'}</small>{!skuCategoryValid&&<span className={styles.inlineError}>کد دسته داخل SKU باید {categoryCode} باشد.</span>}</label>
          <label><RequiredLabel>کالکشن</RequiredLabel><select name="collectionId" value={collectionId} onChange={event=>setCollectionId(event.target.value)}><option value="">بدون کالکشن</option>{collections.map(c=><option key={c.id} value={c.id}>{c.nameFa}</option>)}</select><small>پیشنهاد خودکار SKU از کد کالکشن هم استفاده می‌کند.</small></label>
        </div>
        <label>وضعیت<select name="status" defaultValue={product.status}>{statuses.filter(([value])=>value!=='ACTIVE'||product.status==='ACTIVE').map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <div className={styles.readonly}><div><span>دسته‌بندی فعلی</span><strong>{categories.find(([value])=>value===categoryCode)?.[1]??categoryCode??'—'}</strong></div><div><span>عیار</span><strong>{product.purity}</strong></div><div><span>Unit موجود</span><strong>{product.availableCount}</strong></div></div>
        <div className={styles.wizardNav}><span/><button className={styles.primary} disabled={busy}>{busy?'در حال ذخیره...':'ذخیره و مرحله بعد'}</button></div>
      </form>
    </section><section className={styles.dangerZone}><div><span>DANGER ZONE</span><h3>حذف دائمی محصول</h3><p>اگر محصول یا Unitهایش سابقه سفارش، رزرو یا After Sales داشته باشند حذف دائمی مسدود می‌شود. برای نگهداری تاریخچه از «آرشیو» استفاده کن.</p></div><button disabled={busy||product.status==='ACTIVE'} onClick={deleteProduct}>حذف دائمی محصول</button></section></>}

    {tab==='CONTENT'&&<ProductContentPanel products={[{id:product.id,nameFa:product.nameFa,masterSku:product.masterSku}]} initialProductId={product.id} hideSelector onBack={()=>goTo('BASICS')} onSaved={()=>goTo('UNITS')} backLabel="مرحله قبل" saveLabel="ذخیره و مرحله بعد"/>}

    {tab==='UNITS'&&<section className={styles.card}>
      <div className={styles.sectionHead}><div><span>مرحله ۳ از ۴</span><h2>Unit و موجودی</h2></div><a href="/inventory">همه موجودی‌ها</a></div>
      <div className={styles.unitRequirement}><b>*</b><span>برای انتشار، حداقل یک Unit باید با وضعیت «موجود» ثبت شده باشد.</span></div>
      <form className={styles.unitForm} onSubmit={createUnit}>
        <label><RequiredLabel>Unit SKU</RequiredLabel><input name="unitSku" dir="ltr" required value={unitSku} aria-invalid={!unitSkuValid} onChange={event=>setUnitSku(event.target.value.toUpperCase())}/><small>سیستم شماره Unit بعدی را پیشنهاد می‌دهد؛ فقط در صورت نیاز ادیت کن.</small>{!unitSkuValid&&<span className={styles.inlineError}>Unit SKU باید با {product.masterSku}-U شروع شود.</span>}</label>
        <label><RequiredLabel>وزن دقیق (گرم)</RequiredLabel><input name="exactWeightGram" type="number" step="0.001" min="0.001" required placeholder="0.820"/></label>
        <label><RequiredLabel>وضعیت</RequiredLabel><select name="status" defaultValue="QC_PENDING">{unitStatuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <button disabled={busy}>+ ساخت Unit</button>
      </form>
      <div className={styles.unitList}>{(product.units??[]).map(unit=><form key={unit.id} className={styles.unitRow} onSubmit={event=>saveUnit(event,unit)}><div><strong dir="ltr">{unit.unitSku}</strong><small>{unit.currentPriceToman===null?'قیمت پس از Quote محاسبه می‌شود':new Intl.NumberFormat('fa-IR').format(unit.currentPriceToman)+' تومان'}</small></div><label><span>وزن</span><input name="exactWeightGram" type="number" step="0.001" min="0.001" defaultValue={unit.exactWeightGram} disabled={['RESERVED','SOLD','RETURNED'].includes(unit.status)}/></label><label><span>وضعیت</span><select name="status" defaultValue={unit.status} disabled={['RESERVED','SOLD','RETURNED'].includes(unit.status)}>{unitStatuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><small>{unitStatusLabel[unit.status]??unit.status}</small></label><div className={styles.unitActions}><button type="submit" disabled={busy||['RESERVED','SOLD','RETURNED'].includes(unit.status)}>ذخیره</button><button type="button" className={styles.deleteUnit} disabled={busy||['RESERVED','SOLD','RETURNED'].includes(unit.status)} onClick={()=>deleteUnit(unit)}>حذف</button></div></form>)}{(product.units?.length??0)===0&&<div className={styles.empty}>هنوز Unitی برای این محصول ثبت نشده است.</div>}</div>
      <div className={styles.wizardNav}><button type="button" className={styles.secondary} onClick={()=>goTo('CONTENT')}>مرحله قبل</button><button type="button" className={styles.primary} disabled={busy} onClick={()=>goTo('PUBLISH')}>مرحله بعد: انتشار</button></div>
    </section>}

    {tab==='PUBLISH'&&<section className={styles.card}><div className={styles.sectionHead}><div><span>مرحله ۴ از ۴</span><h2>آمادگی انتشار</h2></div><span className={product.status==='ACTIVE'?styles.live:styles.draft}>{product.status==='ACTIVE'?'LIVE':'DRAFT'}</span></div><div className={styles.publishBox}><div className={styles.score}><strong>{readiness?`${readiness.completedSteps}/${readiness.totalSteps}`:'—'}</strong><span>مراحل تکمیل‌شده</span></div><div className={styles.missing}><strong>{readiness?.readyToPublish?'محصول آماده انتشار است.':'موارد باقیمانده'}</strong>{readiness?.missing?.length?<ul>{readiness.missing.map(item=><li key={item}>{item}</li>)}</ul>:<p>همه Gateها تکمیل شده‌اند.</p>}</div></div><div className={styles.publishActions}><button type="button" className={styles.secondary} onClick={()=>goTo('UNITS')}>مرحله قبل</button>{product.status!=='ACTIVE'&&<button className={styles.publish} disabled={busy||!readiness?.readyToPublish} onClick={publish}>{busy?'در حال انتشار...':'انتشار محصول'}</button>}</div>{product.status==='ACTIVE'&&<p className={styles.liveNote}>این محصول در Storefront فعال است. برای توقف نمایش، از مرحله اطلاعات اصلی وضعیت را به «مخفی» یا «ناموجود» تغییر بده.</p>}</section>}
  </div>;
}
