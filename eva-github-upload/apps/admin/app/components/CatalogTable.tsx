'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminFilterMenu, { type AdminFilterOption } from './AdminFilterMenu';
import styles from './CatalogTable.module.css';

type Product={id:string;nameFa:string;slug:string;masterSku:string;purity:number;status:string;collection:string|null;unitCount:number;availableCount:number};
type Lifecycle={id:string;isVisible:boolean};

const statusLabels:Record<string,string>={ACTIVE:'فعال',DRAFT:'پیش‌نویس',OUT_OF_STOCK:'ناموجود',HIDDEN:'مخفی',DISCONTINUED:'توقف عرضه',ARCHIVED:'آرشیو'};
const categories=[['NEC','گردنبند'],['PEN','آویز'],['BRA','دستبند'],['RIN','انگشتر'],['EAR','گوشواره'],['SET','ست'],['ANK','پابند'],['CHM','چارم']] as const;
const categoryLabels=Object.fromEntries(categories) as Record<string,string>;
const categoryFromSku=(sku:string)=>sku.split('-')[2]??'';
const categoryOptions:AdminFilterOption[]=[{value:'ALL',label:'همه دسته‌بندی‌ها'},...categories.map(([value,label])=>({value,label}))];
const statusOptions:AdminFilterOption[]=[{value:'ALL',label:'همه وضعیت‌ها'},...Object.entries(statusLabels).map(([value,label])=>({value,label}))];
const visibilityOptions:AdminFilterOption[]=[{value:'ALL',label:'همه محصولات'},{value:'VISIBLE',label:'نمایش در سایت'},{value:'HIDDEN',label:'عدم نمایش در سایت'}];
const stoneOptions:AdminFilterOption[]=[{value:'ALL',label:'همه محصولات'},{value:'STONE',label:'فقط سنگ‌دار'},{value:'NO_STONE',label:'بدون سنگ'}];
const fa=(value:number)=>new Intl.NumberFormat('fa-IR').format(value);

export default function CatalogTable({products}:{products:Product[]}){
  const [query,setQuery]=useState('');const [status,setStatus]=useState('ALL');const [visibility,setVisibility]=useState('ALL');const [collection,setCollection]=useState('ALL');const [category,setCategory]=useState('ALL');const [stone,setStone]=useState('ALL');
  const [stoneByProduct,setStoneByProduct]=useState<Record<string,boolean>>({});
  const [visibleByProduct,setVisibleByProduct]=useState<Record<string,boolean>>({});
  const collections=useMemo(()=>Array.from(new Set(products.map(p=>p.collection).filter(Boolean) as string[])),[products]);
  const collectionOptions=useMemo<AdminFilterOption[]>(()=>[{value:'ALL',label:'همه کالکشن‌ها'},...collections.map(name=>({value:name,label:name}))],[collections]);

  useEffect(()=>{let active=true;void Promise.all(products.map(async product=>{try{const response=await fetch(`/api/admin/stone-units/product/${encodeURIComponent(product.id)}`,{cache:'no-store'});if(!response.ok)return [product.id,false] as const;const data=await response.json() as {units?:Array<{hasStone?:boolean}>};return [product.id,Boolean(data.units?.some(unit=>unit.hasStone))] as const;}catch{return [product.id,false] as const;}})).then(entries=>{if(active)setStoneByProduct(Object.fromEntries(entries));});return()=>{active=false;};},[products]);
  useEffect(()=>{let active=true;void fetch('/api/admin/product-lifecycle',{cache:'no-store'}).then(async response=>response.ok?response.json():[]).then((items:Lifecycle[])=>{if(active)setVisibleByProduct(Object.fromEntries(items.map(item=>[item.id,item.isVisible])));}).catch(()=>{});return()=>{active=false;};},[products]);

  const result=useMemo(()=>products.filter(product=>{const q=query.trim().toLowerCase();const text=[product.nameFa,product.slug,product.masterSku,product.collection].filter(Boolean).join(' ').toLowerCase();const hasStone=Boolean(stoneByProduct[product.id]);const isVisible=visibleByProduct[product.id]??true;return (!q||text.includes(q))&&(status==='ALL'||product.status===status)&&(visibility==='ALL'||(visibility==='VISIBLE'&&isVisible)||(visibility==='HIDDEN'&&!isVisible))&&(collection==='ALL'||product.collection===collection)&&(category==='ALL'||categoryFromSku(product.masterSku)===category)&&(stone==='ALL'||(stone==='STONE'&&hasStone)||(stone==='NO_STONE'&&!hasStone));}),[products,query,status,visibility,collection,category,stone,stoneByProduct,visibleByProduct]);
  const filtersActive=Boolean(query)||status!=='ALL'||visibility!=='ALL'||collection!=='ALL'||category!=='ALL'||stone!=='ALL';
  const reset=()=>{setQuery('');setStatus('ALL');setVisibility('ALL');setCollection('ALL');setCategory('ALL');setStone('ALL');};

  return <section className={styles.wrap}>
    <div className="v2FilterBar"><div className="v2FilterTop"><div className="v2FilterTitle"><strong>فیلتر محصولات</strong><small>محصول را با نام، دسته‌بندی، کالکشن، وضعیت، نمایش سایت یا سنگ‌دار بودن پیدا کن.</small></div><div className="v2FilterMeta"><span className="v2FilterCount">{fa(result.length)} محصول</span>{filtersActive&&<button type="button" className="v2FilterReset" onClick={reset}>پاک کردن</button>}</div></div>
      <div className={`v2FilterGrid ${styles.filterGrid}`}><label className="v2FilterField v2FilterSearch"><span>جستجو</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="نام، SKU یا Slug" /></label><div className="v2FilterField"><AdminFilterMenu label="دسته‌بندی" value={category} options={categoryOptions} onChange={setCategory}/></div><div className="v2FilterField"><AdminFilterMenu label="وضعیت" value={status} options={statusOptions} onChange={setStatus}/></div><div className="v2FilterField"><AdminFilterMenu label="نمایش سایت" value={visibility} options={visibilityOptions} onChange={setVisibility}/></div><div className="v2FilterField"><AdminFilterMenu label="کالکشن" value={collection} options={collectionOptions} onChange={setCollection}/></div><div className="v2FilterField"><AdminFilterMenu label="سنگ" value={stone} options={stoneOptions} onChange={setStone}/></div></div>
    </div>
    <div className={styles.list}>{result.map(product=>{const categoryCode=categoryFromSku(product.masterSku);const hasStone=Boolean(stoneByProduct[product.id]);const isVisible=visibleByProduct[product.id]??true;return <article className={styles.card} key={product.id}><div className={styles.main}><div className={styles.identity}><div className={styles.titleLine}><strong>{product.nameFa}</strong><span className={`badge ${product.status.toLowerCase()}`}>{statusLabels[product.status]??product.status}</span><span className={isVisible?styles.visibleBadge:styles.hiddenBadge}>{isVisible?'نمایش در سایت':'عدم نمایش'}</span>{hasStone&&<span className={styles.stoneBadge}>سنگ‌دار</span>}</div><small>/{product.slug}</small><code dir="ltr">{product.masterSku}</code></div><div className={styles.tags}><span>{categoryLabels[categoryCode]??categoryCode??'—'}</span><span>{product.collection??'بدون کالکشن'}</span><span>{fa(product.purity)} عیار</span></div></div><div className={styles.stats}><div><span>Unit</span><b>{fa(product.unitCount)}</b></div><div><span>موجود</span><b>{fa(product.availableCount)}</b></div></div><a className={styles.edit} href={`/catalog/products/${product.id}`}>ویرایش محصول</a></article>;})}{result.length===0&&<div className={styles.empty}>محصولی با این فیلتر پیدا نشد.</div>}</div>
  </section>;
}
