'use client';

import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProductCreateForm.module.css';

type Collection={id:string;nameFa:string;slug:string;code:string};
type CreatedProduct={id:string;nameFa:string;masterSku:string};
type ExistingProduct={masterSku:string};

const categories=[['NEC','گردنبند'],['PEN','آویز'],['BRA','دستبند'],['RIN','انگشتر'],['EAR','گوشواره'],['SET','ست'],['ANK','پابند'],['CHM','چارم']] as const;
const wizardSteps=['اطلاعات اصلی','قیمت‌گذاری','محتوا و تصاویر','Unit و موجودی','انتشار'];

function RequiredLabel({children}:{children:ReactNode}){return <span className={styles.requiredLabel}>{children}<b aria-hidden="true">*</b></span>;}
function categoryFromSku(masterSku:string){return masterSku.trim().toUpperCase().split('-')[2]??'';}
function slugToken(slug:string){const clean=slug.replace(/[^a-z0-9]/gi,'').toUpperCase();return (clean.slice(0,3)||'PRD').padEnd(3,'X');}
function nextSequence(products:ExistingProduct[]){const max=products.reduce((current,product)=>{const match=product.masterSku.match(/-(\d{3,})$/);return match?Math.max(current,Number(match[1])):current;},0);return String(max+1).padStart(3,'0');}
function buildSuggestedSku(collectionCode:string,categoryCode:string,slug:string,sequence:string){return `EVA-${(collectionCode||'GEN').toUpperCase()}-${categoryCode||'CAT'}-${slugToken(slug)}-${sequence}`;}

async function adminRequest(path:string,method:'POST'|'PATCH'|'DELETE',payload?:Record<string,unknown>){
  const response=await fetch('/api/admin/'+path,{method,headers:payload?{'content-type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined});
  const raw=await response.text();
  if(!response.ok){try{const parsed=JSON.parse(raw);throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));}catch(error){if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;throw new Error(raw||`HTTP ${response.status}`);}}
  return raw?JSON.parse(raw):null;
}

export default function ProductCreateForm({collections,existingProducts}:{collections:Collection[];existingProducts:ExistingProduct[]}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const [categoryCode,setCategoryCode]=useState('');const [slug,setSlug]=useState('');const [collectionId,setCollectionId]=useState('');
  const [manualSku,setManualSku]=useState('');const [manualMode,setManualMode]=useState(false);
  const sequence=useMemo(()=>nextSequence(existingProducts),[existingProducts]);
  const collectionCode=collections.find(collection=>collection.id===collectionId)?.code??'GEN';
  const suggestedSku=buildSuggestedSku(collectionCode,categoryCode,slug,sequence);const masterSku=manualMode?manualSku:suggestedSku;
  const skuCategoryValid=!categoryCode||categoryFromSku(masterSku)===categoryCode;

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;
    if(!categoryCode){setError('دسته‌بندی محصول را انتخاب کن.');return;}
    if(!skuCategoryValid){setError(`کد دسته‌بندی داخل Master SKU باید ${categoryCode} باشد.`);return;}
    setBusy(true);setError('');const data=new FormData(event.currentTarget);
    let product:CreatedProduct|null=null;
    try{
      product=await adminRequest('products','POST',{nameFa:data.get('nameFa'),slug:slug.trim().toLowerCase(),masterSku:masterSku.trim().toUpperCase(),categoryCode,purity:Number(data.get('purity')??18),collectionId:collectionId||null,status:'DRAFT'}) as CreatedProduct;
      window.dispatchEvent(new Event('eva-admin-catalog-change'));
      router.push(`/catalog/products/${product.id}?step=PRICING`);router.refresh();
    }catch(cause){if(product?.id){try{await adminRequest(`products/${product.id}`,'DELETE');}catch{}}setError(cause instanceof Error?cause.message:'ساخت محصول انجام نشد.');setBusy(false);}
  }

  return <section className={styles.wrap}>
    <div className={styles.stepperWrap}><div className={styles.stepper} aria-label="مراحل ساخت محصول">{wizardSteps.map((label,index)=><div key={label} className={`${styles.step} ${index===0?styles.stepActive:''}`}><span className={styles.stepNumber}>{index+1}</span><div><strong>{label}</strong><small>{index===0?'مرحله فعلی':'در ادامه'}</small></div></div>)}</div></div>
    <div className={styles.intro}><span>مرحله ۱ از ۵</span><h2>اطلاعات اصلی محصول</h2><p>ابتدا هویت محصول را ثبت کن. اجرت، سود و مالیات در مرحله مستقل بعدی وارد می‌شوند.</p></div>
    {error&&<div className={styles.error}>{error}</div>}
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.requiredNote}><b>*</b><span>فیلد الزامی؛ کالکشن برای Publish الزامی است حتی اگر Draft بدون آن ذخیره شود.</span></div>
      <div className={styles.grid2}><label><RequiredLabel>نام فارسی محصول</RequiredLabel><input name="nameFa" required autoFocus placeholder="مثلاً طلوع"/></label><label><RequiredLabel>Slug انگلیسی</RequiredLabel><input name="slug" dir="ltr" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={event=>setSlug(event.target.value.toLowerCase())} placeholder="tolou"/><small>برای ساخت پیشنهاد SKU هم استفاده می‌شود.</small></label></div>
      <div className={styles.grid2}><label><RequiredLabel>دسته‌بندی</RequiredLabel><select name="categoryCode" value={categoryCode} onChange={event=>setCategoryCode(event.target.value)} required><option value="">انتخاب دسته‌بندی</option>{categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><small>مثلاً انگشتر = RIN؛ این کد باید با SKU یکی باشد.</small></label><label><RequiredLabel>عیار</RequiredLabel><input name="purity" type="number" min="1" max="24" step="1" defaultValue="18" required/></label></div>
      <label><RequiredLabel>کالکشن</RequiredLabel><select name="collectionId" value={collectionId} onChange={event=>setCollectionId(event.target.value)}><option value="">بدون کالکشن</option>{collections.map(collection=><option key={collection.id} value={collection.id}>{collection.nameFa}</option>)}</select><small>کد کالکشن در پیشنهاد خودکار SKU استفاده می‌شود.</small></label>
      <label><RequiredLabel>Master SKU</RequiredLabel><div className={styles.skuLine}><input name="masterSku" dir="ltr" required pattern="EVA-[A-Z0-9-]+" value={masterSku} aria-invalid={!skuCategoryValid} onChange={event=>{setManualMode(true);setManualSku(event.target.value.toUpperCase());}}/><button type="button" className={styles.autoButton} onClick={()=>{setManualMode(false);setManualSku('');}}>پیشنهاد خودکار</button></div><small>{manualMode?'حالت دستی فعال است؛ ساختار SKU و کد دسته‌بندی همچنان اعتبارسنجی می‌شوند.':'پیشنهاد سیستم با اطلاعات بالا به‌روز می‌شود.'}</small>{!skuCategoryValid&&<span className={styles.inlineError}>کد دسته داخل SKU با دسته‌بندی انتخاب‌شده یکسان نیست؛ باید {categoryCode} باشد.</span>}</label>
      <div className={styles.note}><strong>مرحله بعد: قیمت‌گذاری</strong><span>اجرت، سود و مالیات این محصول جدا از سایر محصولات ثبت می‌شوند.</span></div>
      <div className={styles.actions}><a href="/catalog">انصراف</a><button disabled={busy}>{busy?'در حال ساخت…':'ساخت محصول و رفتن به قیمت‌گذاری'}</button></div>
    </form>
  </section>;
}
