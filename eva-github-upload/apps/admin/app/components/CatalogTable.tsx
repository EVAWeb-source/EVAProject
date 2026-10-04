'use client';

import { useMemo, useState } from 'react';

type Product={id:string;nameFa:string;slug:string;masterSku:string;purity:number;status:string;collection:string|null;unitCount:number;availableCount:number};

const statusLabels:Record<string,string>={ACTIVE:'فعال',DRAFT:'پیش‌نویس',OUT_OF_STOCK:'ناموجود',HIDDEN:'مخفی',DISCONTINUED:'توقف عرضه',ARCHIVED:'آرشیو'};

export default function CatalogTable({products}:{products:Product[]}){
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('ALL');
  const [collection,setCollection]=useState('ALL');
  const collections=useMemo(()=>Array.from(new Set(products.map(p=>p.collection).filter(Boolean) as string[])),[products]);
  const result=useMemo(()=>products.filter(product=>{
    const q=query.trim().toLowerCase();
    const text=[product.nameFa,product.slug,product.masterSku,product.collection].filter(Boolean).join(' ').toLowerCase();
    return (!q||text.includes(q))&&(status==='ALL'||product.status===status)&&(collection==='ALL'||product.collection===collection);
  }),[products,query,status,collection]);

  return <section className="panel">
    <div className="v2Toolbar">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در نام، SKU یا Slug" />
      <select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">همه وضعیت‌ها</option>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <select value={collection} onChange={e=>setCollection(e.target.value)}><option value="ALL">همه کالکشن‌ها</option>{collections.map(name=><option key={name} value={name}>{name}</option>)}</select>
      <span>{new Intl.NumberFormat('fa-IR').format(result.length)} محصول</span>
    </div>
    <div className="tableWrap"><table><thead><tr><th>محصول</th><th>کالکشن</th><th>Master SKU</th><th>عیار</th><th>Unit</th><th>موجود</th><th>وضعیت</th><th></th></tr></thead><tbody>
      {result.map(product=><tr key={product.id}>
        <td><strong>{product.nameFa}</strong><small>/{product.slug}</small></td><td>{product.collection??'—'}</td><td dir="ltr">{product.masterSku}</td><td>{new Intl.NumberFormat('fa-IR').format(product.purity)}</td><td>{new Intl.NumberFormat('fa-IR').format(product.unitCount)}</td><td>{new Intl.NumberFormat('fa-IR').format(product.availableCount)}</td><td><span className={`badge ${product.status.toLowerCase()}`}>{statusLabels[product.status]??product.status}</span></td><td><a className="v2RowLink" href={`/catalog/products/${product.id}`}>ویرایش ←</a></td>
      </tr>)}
      {result.length===0&&<tr><td colSpan={8}>محصولی با این فیلتر پیدا نشد.</td></tr>}
    </tbody></table></div>
  </section>;
}
