'use client';

import { useMemo, useState } from 'react';
import AdminFilterMenu, { type AdminFilterOption } from './AdminFilterMenu';

type Product={id:string;nameFa:string;slug:string;masterSku:string;purity:number;status:string;collection:string|null;unitCount:number;availableCount:number};

const statusLabels:Record<string,string>={ACTIVE:'فعال',DRAFT:'پیش‌نویس',OUT_OF_STOCK:'ناموجود',HIDDEN:'مخفی',DISCONTINUED:'توقف عرضه',ARCHIVED:'آرشیو'};
const categories=[['NEC','گردنبند'],['PEN','آویز'],['BRA','دستبند'],['RIN','انگشتر'],['EAR','گوشواره'],['SET','ست'],['ANK','پابند'],['CHM','چارم']] as const;
const categoryFromSku=(sku:string)=>sku.split('-')[2]??'';
const categoryOptions:AdminFilterOption[]=[{value:'ALL',label:'همه دسته‌بندی‌ها'},...categories.map(([value,label])=>({value,label}))];
const statusOptions:AdminFilterOption[]=[{value:'ALL',label:'همه وضعیت‌ها'},...Object.entries(statusLabels).map(([value,label])=>({value,label}))];

export default function CatalogTable({products}:{products:Product[]}){
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('ALL');
  const [collection,setCollection]=useState('ALL');
  const [category,setCategory]=useState('ALL');
  const collections=useMemo(()=>Array.from(new Set(products.map(p=>p.collection).filter(Boolean) as string[])),[products]);
  const collectionOptions=useMemo<AdminFilterOption[]>(()=>[{value:'ALL',label:'همه کالکشن‌ها'},...collections.map(name=>({value:name,label:name}))],[collections]);
  const result=useMemo(()=>products.filter(product=>{
    const q=query.trim().toLowerCase();
    const text=[product.nameFa,product.slug,product.masterSku,product.collection].filter(Boolean).join(' ').toLowerCase();
    return (!q||text.includes(q))&&(status==='ALL'||product.status===status)&&(collection==='ALL'||product.collection===collection)&&(category==='ALL'||categoryFromSku(product.masterSku)===category);
  }),[products,query,status,collection,category]);
  const filtersActive=Boolean(query)||status!=='ALL'||collection!=='ALL'||category!=='ALL';
  const reset=()=>{setQuery('');setStatus('ALL');setCollection('ALL');setCategory('ALL');};

  return <section>
    <div className="v2FilterBar">
      <div className="v2FilterTop">
        <div className="v2FilterTitle"><strong>فیلتر محصولات</strong><small>نام، دسته‌بندی، کالکشن یا وضعیت محصول را انتخاب کن.</small></div>
        <div className="v2FilterMeta"><span className="v2FilterCount">{new Intl.NumberFormat('fa-IR').format(result.length)} محصول</span>{filtersActive&&<button type="button" className="v2FilterReset" onClick={reset}>پاک کردن فیلترها</button>}</div>
      </div>
      <div className="v2FilterGrid compact">
        <label className="v2FilterField v2FilterSearch"><span>جستجو</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="نام، SKU یا Slug" /></label>
        <div className="v2FilterField"><AdminFilterMenu label="دسته‌بندی" value={category} options={categoryOptions} onChange={setCategory}/></div>
        <div className="v2FilterField"><AdminFilterMenu label="وضعیت" value={status} options={statusOptions} onChange={setStatus}/></div>
        <div className="v2FilterField"><AdminFilterMenu label="کالکشن" value={collection} options={collectionOptions} onChange={setCollection}/></div>
      </div>
    </div>
    <div className="panel">
      <div className="tableWrap"><table><thead><tr><th>محصول</th><th>کالکشن</th><th>Master SKU</th><th>عیار</th><th>Unit</th><th>موجود</th><th>وضعیت</th><th></th></tr></thead><tbody>
        {result.map(product=><tr key={product.id}>
          <td><strong>{product.nameFa}</strong><small>/{product.slug}</small></td><td>{product.collection??'—'}</td><td dir="ltr">{product.masterSku}</td><td>{new Intl.NumberFormat('fa-IR').format(product.purity)}</td><td>{new Intl.NumberFormat('fa-IR').format(product.unitCount)}</td><td>{new Intl.NumberFormat('fa-IR').format(product.availableCount)}</td><td><span className={`badge ${product.status.toLowerCase()}`}>{statusLabels[product.status]??product.status}</span></td><td><a className="v2RowLink" href={`/catalog/products/${product.id}`}>ویرایش ←</a></td>
        </tr>)}
        {result.length===0&&<tr><td colSpan={8}>محصولی با این فیلتر پیدا نشد.</td></tr>}
      </tbody></table></div>
    </div>
  </section>;
}
