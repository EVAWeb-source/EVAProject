'use client';

import { useMemo, useState } from 'react';
import CatalogGrid, { type CatalogProduct } from '../components/CatalogGrid';
import FilterMenu, { type FilterOption } from '../components/FilterMenu';
import styles from './lightweight.module.css';

const categoryLabels:Record<string,string>={
  NEC:'گردنبند', PEN:'آویز', BRA:'دستبند', RIN:'انگشتر',
  EAR:'گوشواره', SET:'ست', ANK:'پابند', CHM:'چارم',
};
const categoryOrder=['NEC','PEN','BRA','RIN','EAR','SET','ANK','CHM'];

const weightOptions:FilterOption[]=[
  {value:'ALL',label:'همه وزن‌های سبک'},
  {value:'UNDER07',label:'کمتر از ۰.۷ گرم',note:'بسیار سبک'},
  {value:'07TO085',label:'۰.۷ تا ۰.۸۵ گرم',note:'سبک روزمره'},
  {value:'085TO1',label:'۰.۸۵ تا ۱ گرم',note:'نزدیک به یک گرم'},
];

const sortOptions:FilterOption[]=[
  {value:'WEIGHT_ASC',label:'سبک‌تر اول'},
  {value:'PRICE_ASC',label:'قیمت: کم به زیاد'},
  {value:'PRICE_DESC',label:'قیمت: زیاد به کم'},
];

function categoryCode(sku:string){ return sku.split('-')[2] ?? 'OTHER'; }

export default function LightweightCatalog({products}:{products:CatalogProduct[]}){
  const [band,setBand]=useState('ALL');
  const [category,setCategory]=useState('ALL');
  const [sort,setSort]=useState('WEIGHT_ASC');

  const categories=useMemo(()=>new Set(products.map(product=>categoryCode(product.masterSku))),[products]);

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

  return <section className={styles.catalogSection} id="lightweight-catalog">
    <div className={styles.filterDock}>
      <nav className={styles.categoryTabs} aria-label="دسته‌بندی طلای سبک">
        <button type="button" className={category==='ALL'?styles.activeTab:''} onClick={()=>setCategory('ALL')}>همه</button>
        {categoryOrder.filter(code=>categories.has(code)).map(code=><button type="button" key={code} className={category===code?styles.activeTab:''} onClick={()=>setCategory(code)}>{categoryLabels[code]}</button>)}
      </nav>
      <div className={styles.toolbar}>
        <div className={styles.toolbarIntro}><span>LIGHT FILTER</span><strong>{new Intl.NumberFormat('fa-IR').format(result.length)} محصول برای انتخاب</strong></div>
        <div className={styles.controls}>
          <FilterMenu label="وزن" value={band} options={weightOptions} onChange={setBand}/>
          <FilterMenu label="مرتب‌سازی" value={sort} options={sortOptions} onChange={setSort}/>
        </div>
      </div>
    </div>

    {filtered&&<div className={styles.filterState}><span>{new Intl.NumberFormat('fa-IR').format(result.length)} نتیجه با انتخاب فعلی</span><button type="button" onClick={reset}>پاک‌کردن فیلترها</button></div>}

    <CatalogGrid
      products={result}
      emptyTitle="فعلاً محصولی در این بازه وزن نداریم."
      emptyText="محدوده وزن یا دسته را تغییر بده تا گزینه‌های دیگر طلای سبک را ببینی."
    />
  </section>;
}
