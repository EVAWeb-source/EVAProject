'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import CatalogGrid, { type CatalogProduct } from '../components/CatalogGrid';
import styles from './search.module.css';

const categories:Record<string,string>={NEC:'گردنبند',PEN:'آویز',BRA:'دستبند',RIN:'انگشتر',EAR:'گوشواره',SET:'ست',ANK:'پابند',CHM:'چارم'};
function categoryCode(masterSku:string){return masterSku.split('-')[2]??'OTHER';}
function normalize(value:string){return value.trim().toLocaleLowerCase('fa').replace(/ي/g,'ی').replace(/ك/g,'ک');}

export default function SearchClient({products,initialQuery}:{products:CatalogProduct[];initialQuery:string}){
  const [query,setQuery]=useState(initialQuery);
  const [category,setCategory]=useState('ALL');
  const deferredQuery=useDeferredValue(query);

  const categoryOptions=useMemo(()=>Array.from(new Set(products.map(product=>categoryCode(product.masterSku)))).filter(code=>categories[code]),[products]);

  const result=useMemo(()=>{
    const q=normalize(deferredQuery);
    if(!q&&category==='ALL')return [];
    return products.filter(product=>{
      if(product.units.length===0)return false;
      const code=categoryCode(product.masterSku);
      if(category!=='ALL'&&code!==category)return false;
      const haystack=normalize([
        product.nameFa,
        product.shortDescription,
        product.masterSku,
        product.collection?.nameFa,
        categories[code],
      ].filter(Boolean).join(' '));
      return !q||haystack.includes(q);
    });
  },[products,deferredQuery,category]);

  const hasIntent=Boolean(normalize(deferredQuery)||category!=='ALL');
  const clear=()=>{setQuery('');setCategory('ALL');};

  return <>
    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><span>جستجو</span></div>

    <section className={styles.hero}>
      <span>SEARCH EVA</span>
      <h1>چی دنبالش می‌گردی؟</h1>
      <p>نام محصول، کالکشن، دسته یا کد محصول را جستجو کن؛ نتیجه‌ها مستقیماً از کاتالوگ فعلی ایوا می‌آیند.</p>

      <label className={styles.searchBox}>
        <span aria-hidden="true">⌕</span>
        <input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="مثلاً گردنبند، آغاز یا کد محصول..." aria-label="جستجو در محصولات ایوا"/>
        {query&&<button type="button" onClick={()=>setQuery('')} aria-label="پاک کردن متن جستجو">×</button>}
      </label>

      <div className={styles.quickFilters} aria-label="فیلتر سریع دسته‌بندی">
        <button type="button" className={category==='ALL'?styles.active:''} onClick={()=>setCategory('ALL')}>همه</button>
        {categoryOptions.map(code=><button type="button" key={code} className={category===code?styles.active:''} onClick={()=>setCategory(code)}>{categories[code]}</button>)}
      </div>
    </section>

    <section className={styles.results}>
      <div className={styles.resultsHead}>
        <div><span>SEARCH RESULTS</span><h2>{!hasIntent?'برای شروع جستجو کن':result.length?`${new Intl.NumberFormat('fa-IR').format(result.length)} نتیجه پیدا شد`:'نتیجه‌ای پیدا نشد'}</h2></div>
        {hasIntent&&<button type="button" onClick={clear}>پاک‌کردن جستجو</button>}
      </div>

      {!hasIntent?<div className={styles.startState}><strong>می‌تونی با اسم یا دسته شروع کنی.</strong><p>اگر هنوز دقیق نمی‌دونی چی می‌خوای، فروشگاه کامل یا کالکشن‌ها مسیر بهتری برای مرور هستن.</p><div><Link href="/shop">فروشگاه</Link><Link href="/collections">کالکشن‌ها</Link></div></div>:
        result.length?<CatalogGrid products={result}/>:<div className={styles.emptyState}><strong>چیزی با این عبارت پیدا نکردیم.</strong><p>املای کلمه را تغییر بده، یک دسته دیگر انتخاب کن یا همه محصولات را ببین.</p><Link href="/shop">مشاهده فروشگاه</Link></div>}
    </section>
  </>;
}
