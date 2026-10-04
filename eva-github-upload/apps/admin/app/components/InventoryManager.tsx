'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Product={id:string;nameFa:string;masterSku:string};
type Unit={id:string;productId:string;unitSku:string;productNameFa:string;masterSku:string;exactWeightGram:string;currentPriceToman:number|null;status:string;reservedUntil:string|null};

const statuses=[['QC_PENDING','در انتظار QC'],['AVAILABLE','موجود'],['QUALITY_HOLD','توقف QC'],['DAMAGED','آسیب‌دیده'],['UNAVAILABLE','غیرقابل فروش']];
const labels:Record<string,string>={QC_PENDING:'در انتظار QC',AVAILABLE:'موجود',RESERVED:'رزرو',SOLD:'فروخته‌شده',RETURNED:'مرجوعی',QUALITY_HOLD:'توقف QC',DAMAGED:'آسیب‌دیده',UNAVAILABLE:'غیرقابل فروش'};

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
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  const result=useMemo(()=>units.filter(unit=>{
    const q=query.trim().toLowerCase();
    const text=[unit.unitSku,unit.productNameFa,unit.masterSku].join(' ').toLowerCase();
    return (!q||text.includes(q))&&(status==='ALL'||unit.status===status)&&(product==='ALL'||unit.productId===product);
  }),[units,query,status,product]);

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
      <div className="panelHead"><div><span>ADD UNIT</span><h2>ثبت قطعه فیزیکی</h2></div><small>هر Unit یک قطعه واقعی با وزن دقیق است</small></div>
      <form className="v2CreateGrid" onSubmit={createUnit}>
        <label>محصول<select name="productId" required defaultValue={initialProductId??''}><option value="" disabled>انتخاب محصول</option>{products.map(p=><option key={p.id} value={p.id}>{p.nameFa} — {p.masterSku}</option>)}</select></label>
        <label>Unit SKU<input name="unitSku" dir="ltr" required placeholder="EVA-...-U01"/></label>
        <label>وزن دقیق<input name="exactWeightGram" type="number" step="0.001" min="0.001" required placeholder="0.820"/></label>
        <label>وضعیت<select name="status" defaultValue="QC_PENDING">{statuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <button className="primaryButton" disabled={busy==='create'}>{busy==='create'?'در حال ثبت...':'ساخت Unit'}</button>
      </form>
    </section>

    <section className="panel">
      <div className="v2Toolbar">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در Unit SKU یا محصول"/>
        <select value={product} onChange={e=>setProduct(e.target.value)}><option value="ALL">همه محصولات</option>{products.map(p=><option key={p.id} value={p.id}>{p.nameFa}</option>)}</select>
        <select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">همه وضعیت‌ها</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        <span>{new Intl.NumberFormat('fa-IR').format(result.length)} Unit</span>
      </div>
      <div className="v2EditorList">{result.map(unit=>{
        const locked=unit.status==='SOLD'||unit.status==='RESERVED';
        return <form key={unit.id} className="v2UnitRow" onSubmit={event=>updateUnit(event,unit)}>
          <div><strong dir="ltr">{unit.unitSku}</strong><small>{unit.productNameFa}</small></div>
          <label>وزن<input name="exactWeightGram" type="number" step="0.001" min="0.001" defaultValue={unit.exactWeightGram} disabled={locked}/></label>
          <label>وضعیت<select name="status" defaultValue={unit.status} disabled={locked}>{locked?<option value={unit.status}>{labels[unit.status]??unit.status}</option>:statuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <div><span className={`badge ${unit.status.toLowerCase()}`}>{labels[unit.status]??unit.status}</span><small>{unit.currentPriceToman===null?'قیمت بعد از محاسبه':'قیمت: '+new Intl.NumberFormat('fa-IR').format(unit.currentPriceToman)}</small></div>
          <button disabled={locked||busy===unit.id}>{locked?'قفل':'ذخیره'}</button>
        </form>;
      })}{result.length===0&&<div className="v2Empty">Unitی با این فیلتر پیدا نشد.</div>}</div>
    </section>
  </>;
}
