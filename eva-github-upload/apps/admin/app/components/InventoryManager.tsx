'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminFilterMenu, { type AdminFilterOption } from './AdminFilterMenu';
import styles from './InventoryManager.module.css';

type Product={id:string;nameFa:string;masterSku:string};
type Unit={id:string;productId:string;unitSku:string;productNameFa:string;masterSku:string;exactWeightGram:string;currentPriceToman:number|null;status:string;reservedUntil:string|null};

const statuses=[['QC_PENDING','در انتظار QC'],['AVAILABLE','موجود'],['QUALITY_HOLD','توقف QC'],['DAMAGED','آسیب‌دیده'],['UNAVAILABLE','غیرقابل فروش']] as const;
const labels:Record<string,string>={QC_PENDING:'در انتظار QC',AVAILABLE:'موجود',RESERVED:'رزرو',SOLD:'فروخته‌شده',RETURNED:'مرجوعی',QUALITY_HOLD:'توقف QC',DAMAGED:'آسیب‌دیده',UNAVAILABLE:'غیرقابل فروش'};
const categories=[['NEC','گردنبند'],['PEN','آویز'],['BRA','دستبند'],['RIN','انگشتر'],['EAR','گوشواره'],['SET','ست'],['ANK','پابند'],['CHM','چارم']] as const;
const categoryLabels=Object.fromEntries(categories) as Record<string,string>;
const attentionStatuses=new Set(['QC_PENDING','QUALITY_HOLD','RETURNED','DAMAGED']);
const categoryFromSku=(sku:string)=>sku.split('-')[2]??'';
const categoryOptions:AdminFilterOption[]=[{value:'ALL',label:'همه دسته‌بندی‌ها'},...categories.map(([value,label])=>({value,label}))];
const statusOptions:AdminFilterOption[]=[{value:'ALL',label:'همه وضعیت‌ها'},...Object.entries(labels).map(([value,label])=>({value,label}))];
const viewOptions=(attentionCount:number):AdminFilterOption[]=>[
  {value:'ALL',label:'همه Unitها'},
  {value:'ATTENTION',label:`نیازمند توجه (${new Intl.NumberFormat('fa-IR').format(attentionCount)})`,note:'QC، مرجوعی یا آسیب‌دیده'},
];
const sortOptions:AdminFilterOption[]=[
  {value:'SKU',label:'بر اساس SKU'},
  {value:'CATEGORY',label:'دسته‌بندی'},
  {value:'WEIGHT_ASC',label:'وزن کم به زیاد'},
  {value:'WEIGHT_DESC',label:'وزن زیاد به کم'},
  {value:'STATUS',label:'وضعیت'},
];
const fa=(value:number)=>new Intl.NumberFormat('fa-IR').format(value);

async function request(path:string,method:'POST'|'PATCH',payload:Record<string,unknown>){
  const response=await fetch('/api/admin/'+path,{method,headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const raw=await response.text();
  if(!response.ok){try{const parsed=JSON.parse(raw);throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));}catch(error){if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;throw new Error(raw||`HTTP ${response.status}`);}}
  return raw?JSON.parse(raw):null;
}

export default function InventoryManager({products,units,initialProductId}:{products:Product[];units:Unit[];initialProductId?:string}){
  const router=useRouter();
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('ALL');
  const [product,setProduct]=useState(initialProductId??'ALL');
  const [category,setCategory]=useState('ALL');
  const [view,setView]=useState('ALL');
  const [sort,setSort]=useState('SKU');
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  const productOptions=useMemo<AdminFilterOption[]>(()=>[{value:'ALL',label:'همه محصولات'},...products.map(p=>({value:p.id,label:p.nameFa,note:p.masterSku}))],[products]);
  const result=useMemo(()=>units.filter(unit=>{
    const q=query.trim().toLowerCase();
    const text=[unit.unitSku,unit.productNameFa,unit.masterSku,categoryLabels[categoryFromSku(unit.masterSku)]].filter(Boolean).join(' ').toLowerCase();
    const attention=view!=='ATTENTION'||attentionStatuses.has(unit.status);
    const categoryMatch=category==='ALL'||categoryFromSku(unit.masterSku)===category;
    return (!q||text.includes(q))&&(status==='ALL'||unit.status===status)&&(product==='ALL'||unit.productId===product)&&categoryMatch&&attention;
  }).sort((a,b)=>{
    if(sort==='WEIGHT_ASC')return Number(a.exactWeightGram)-Number(b.exactWeightGram);
    if(sort==='WEIGHT_DESC')return Number(b.exactWeightGram)-Number(a.exactWeightGram);
    if(sort==='STATUS')return a.status.localeCompare(b.status);
    if(sort==='CATEGORY')return categoryFromSku(a.masterSku).localeCompare(categoryFromSku(b.masterSku));
    return a.unitSku.localeCompare(b.unitSku);
  }),[units,query,status,product,category,view,sort]);

  const attentionCount=useMemo(()=>units.filter(unit=>attentionStatuses.has(unit.status)).length,[units]);
  const filtersActive=Boolean(query)||status!=='ALL'||product!=='ALL'||category!=='ALL'||view!=='ALL'||sort!=='SKU';
  function clearFilters(){setQuery('');setStatus('ALL');setProduct('ALL');setCategory('ALL');setView('ALL');setSort('SKU');}

  async function createUnit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy('create');setMessage('');setError('');
    const form=event.currentTarget;const data=new FormData(form);
    try{await request('units','POST',{productId:data.get('productId'),unitSku:data.get('unitSku'),exactWeightGram:data.get('exactWeightGram'),status:data.get('status')||'QC_PENDING'});form.reset();setMessage('Unit جدید ساخته شد.');router.refresh();}
    catch(cause){setError(cause instanceof Error?cause.message:'ساخت Unit انجام نشد.');}
    finally{setBusy('');}
  }

  async function updateUnit(event:FormEvent<HTMLFormElement>,unit:Unit){
    event.preventDefault();setBusy(unit.id);setMessage('');setError('');
    const data=new FormData(event.currentTarget);
    try{await request(`units/${unit.id}`,'PATCH',{status:data.get('status'),exactWeightGram:data.get('exactWeightGram')});setMessage(`Unit ${unit.unitSku} بروزرسانی شد.`);router.refresh();}
    catch(cause){setError(cause instanceof Error?cause.message:'بروزرسانی Unit انجام نشد.');}
    finally{setBusy('');}
  }

  return <>
    {(message||error)&&<div className={error?'actionMessage actionError':'actionMessage'}>{error||message}</div>}
    <section className="panel">
      <div className="panelHead"><div><h2>ثبت قطعه فیزیکی</h2></div><small>هر Unit یک قطعه واقعی با وزن دقیق است</small></div>
      <form className="v2CreateGrid" onSubmit={createUnit}>
        <label>محصول<select name="productId" required defaultValue={initialProductId??''}><option value="" disabled>انتخاب محصول</option>{products.map(p=><option key={p.id} value={p.id}>{p.nameFa} — {p.masterSku}</option>)}</select></label>
        <label>Unit SKU<input name="unitSku" dir="ltr" required placeholder="EVA-...-U01"/></label>
        <label>وزن دقیق<input name="exactWeightGram" type="number" step="0.001" min="0.001" required placeholder="0.820"/></label>
        <label>وضعیت<select name="status" defaultValue="QC_PENDING">{statuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <button className="primaryButton" disabled={busy==='create'}>{busy==='create'?'در حال ثبت...':'ساخت Unit'}</button>
      </form>
    </section>

    <section>
      <div className="v2FilterBar">
        <div className="v2FilterTop">
          <div className="v2FilterTitle"><strong>فیلتر موجودی</strong><small>دسته‌بندی، محصول، وضعیت یا وزن را انتخاب کن.</small></div>
          <div className="v2FilterMeta"><span className="v2FilterCount">{fa(result.length)} Unit</span>{filtersActive&&<button className="v2FilterReset" type="button" onClick={clearFilters}>پاک کردن</button>}</div>
        </div>
        <div className="v2FilterGrid inventoryGrid">
          <label className="v2FilterField v2FilterSearch"><span>جستجو</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Unit SKU، نام محصول یا Master SKU"/></label>
          <div className="v2FilterField v2FilterWide"><AdminFilterMenu label="دسته‌بندی" value={category} options={categoryOptions} onChange={setCategory}/></div>
          <div className="v2FilterField v2FilterProduct"><AdminFilterMenu label="محصول" value={product} options={productOptions} onChange={setProduct}/></div>
          <div className="v2FilterField v2FilterWide"><AdminFilterMenu label="وضعیت" value={status} options={statusOptions} onChange={setStatus}/></div>
          <div className="v2FilterField v2FilterWide"><AdminFilterMenu label="توجه" value={view} options={viewOptions(attentionCount)} onChange={setView}/></div>
          <div className="v2FilterField v2FilterWide"><AdminFilterMenu label="مرتب‌سازی" value={sort} options={sortOptions} onChange={setSort}/></div>
        </div>
      </div>

      <div className={styles.list}>{result.map(unit=>{
        const locked=unit.status==='SOLD'||unit.status==='RESERVED';
        const categoryCode=categoryFromSku(unit.masterSku);
        return <form key={unit.id} className={styles.card} onSubmit={event=>updateUnit(event,unit)}>
          <div className={styles.identity}>
            <div className={styles.titleLine}><strong>{unit.productNameFa}</strong><span className={`badge ${unit.status.toLowerCase()}`}>{labels[unit.status]??unit.status}</span></div>
            <code dir="ltr">{unit.unitSku}</code>
            <div className={styles.meta}><span>{categoryLabels[categoryCode]??categoryCode}</span><span>{unit.masterSku}</span>{unit.currentPriceToman!==null&&<span>{new Intl.NumberFormat('fa-IR').format(unit.currentPriceToman)} تومان</span>}</div>
          </div>
          <label className={styles.field}>وزن دقیق<input name="exactWeightGram" type="number" step="0.001" min="0.001" defaultValue={unit.exactWeightGram} disabled={locked}/></label>
          <label className={styles.field}>وضعیت<select name="status" defaultValue={unit.status} disabled={locked}>{locked?<option value={unit.status}>{labels[unit.status]??unit.status}</option>:statuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <button className={`${styles.save} ${locked?styles.locked:''}`} disabled={locked||busy===unit.id}>{locked?'قفل':'ذخیره'}</button>
        </form>;
      })}{result.length===0&&<div className={styles.empty}>Unitی با این فیلتر پیدا نشد.</div>}</div>
    </section>
  </>;
}
