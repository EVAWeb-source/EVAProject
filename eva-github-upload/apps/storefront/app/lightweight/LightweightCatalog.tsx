'use client';

import { useMemo, useState } from 'react';
import CatalogGrid, { type CatalogProduct } from '../components/CatalogGrid';
import styles from './lightweight.module.css';

const categoryLabels:Record<string,string>={
  NEC:'گردنبند', PEN:'آویز', BRA:'دستبند', RIN:'انگشتر',
  EAR:'گوشواره', SET:'ست', ANK:'پابند', CHM:'چارم',
};

function categoryCode(sku:string){ return sku.split('-')[2] ?? 'OTHER'; }

export default function LightweightCatalog({products}:{products:CatalogProduct[]}){
  const [band,setBand]=useState('ALL');
  const [category,setCategory]=useState('ALL');
  const [sort,setSort]=useState('WEIGHT_ASC');

  const categories=useMemo(()=>Array.from(new Set(products.map(product=>categoryCode(product.masterSku)))),[products]);

  const result=useMemo(()=>{
    const prepared=products.map(product=>{
      const units=product.units.filter(unit=>{
        const value=Number(unit.exactWeightGram);
        if(value>=1)return false;
        if(band==='UNDER07')return value<0.7;
        if(band==='07TO085')return value>=0.7&&value<0.85;
        if(band==='085TO1')return value>=0.85&&value<1;
        return true;
      });
      return {...product,units};
    }).filter(product=>product.units.length>0)
      .filter(product=>category==='ALL'||categoryCode(product.masterSku)===category);

    return [...prepared].sort((a,b)=>{
      const aWeight=Math.min(...a.units.map(unit=>Number(unit.exactWeightGram)));
      const bWeight=Math.min(...b.units.map(unit=>Number(unit.exactWeightGram)));
      const aPrice=Math.min(...a.units.map(unit=>Number(unit.currentPriceToman)));
      const bPrice=Math.min(...b.units.map(unit=>Number(unit.currentPriceToman)));
      if(sort==='PRICE_ASC')return aPrice-bPrice;
      if(sort==='PRICE_DESC')return bPrice-aPrice;
      return aWeight-bWeight;
    });
  },[products,band,category,sort]);

  function reset(){setBand('ALL');setCategory('ALL');setSort('WEIGHT_ASC');}
  const filtered=band!=='ALL'||category!=='ALL'||sort!=='WEIGHT_ASC';

  return <section className={styles.catalogSection}>
    <div className={styles.toolbar}>
      <div><strong>{new Intl.NumberFormat('fa-IR').format(result.length)} محصول</strong><span>دارای حداقل یک Unit زیر ۱ گرم</span></div>
      <div className={styles.controls}>
        <select value={band} onChange={event=>setBand(event.target.value)} aria-label="محدوده وزن">
          <option value="ALL">همه وزن‌های سبک</option>
          <option value="UNDER07">کمتر از ۰.۷ گرم</option>
          <option value="07TO085">۰.۷ تا ۰.۸۵ گرم</option>
          <option value="085TO1">۰.۸۵ تا ۱ گرم</option>
        </select>
        <select value={category} onChange={event=>setCategory(event.target.value)} aria-label="نوع محصول">
          <option value="ALL">همه دسته‌ها</option>
          {categories.map(code=><option key={code} value={code}>{categoryLabels[code]??code}</option>)}
        </select>
        <select value={sort} onChange={event=>setSort(event.target.value)} aria-label="مرتب‌سازی">
          <option value="WEIGHT_ASC">سبک‌تر اول</option>
          <option value="PRICE_ASC">قیمت: کم به زیاد</option>
          <option value="PRICE_DESC">قیمت: زیاد به کم</option>
        </select>
      </div>
    </div>

    {filtered&&<div className={styles.filterState}><span>فیلتر فعال است</span><button onClick={reset}>پاک‌کردن فیلترها</button></div>}

    <CatalogGrid
      products={result}
      emptyTitle="فعلاً محصولی در این بازه وزن نداریم."
      emptyText="محدوده وزن یا دسته را تغییر بده تا گزینه‌های دیگر طلای سبک را ببینی."
    />
  </section>;
}
