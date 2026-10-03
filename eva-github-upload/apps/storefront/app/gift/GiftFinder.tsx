'use client';

import { useMemo, useState } from 'react';
import CatalogGrid, { type CatalogProduct } from '../components/CatalogGrid';
import styles from './gift.module.css';

type Budget = 'UNDER15' | '15TO25' | 'OVER25' | 'FLEX';
type Occasion = 'BIRTHDAY' | 'ANNIVERSARY' | 'MILESTONE' | 'THANKS' | 'JUST_BECAUSE';
type Recipient = 'PARTNER' | 'MOTHER' | 'SISTER_FRIEND' | 'SELF';

const budgetOptions: Array<{value:Budget;label:string;hint:string}> = [
  { value:'UNDER15', label:'تا ۱۵ میلیون', hint:'انتخاب‌های اقتصادی‌تر' },
  { value:'15TO25', label:'۱۵ تا ۲۵ میلیون', hint:'بازه متعادل برای هدیه' },
  { value:'OVER25', label:'بیشتر از ۲۵ میلیون', hint:'برای انتخاب‌های خاص‌تر' },
  { value:'FLEX', label:'بودجه منعطف', hint:'همه گزینه‌های موجود' },
];

const occasionOptions: Array<{value:Occasion;label:string}> = [
  { value:'BIRTHDAY', label:'تولد' },
  { value:'ANNIVERSARY', label:'سالگرد' },
  { value:'MILESTONE', label:'یک اتفاق مهم' },
  { value:'THANKS', label:'تشکر' },
  { value:'JUST_BECAUSE', label:'بی‌مناسبت' },
];

const recipientOptions: Array<{value:Recipient;label:string}> = [
  { value:'PARTNER', label:'همسر / پارتنر' },
  { value:'MOTHER', label:'مادر' },
  { value:'SISTER_FRIEND', label:'خواهر / دوست' },
  { value:'SELF', label:'برای خودم' },
];

const recipientCategoryPriority: Record<Recipient,string[]> = {
  PARTNER:['NEC','EAR','RIN','BRA','SET'],
  MOTHER:['NEC','BRA','EAR','SET'],
  SISTER_FRIEND:['EAR','BRA','CHM','NEC'],
  SELF:['NEC','RIN','BRA','EAR','SET','PEN','CHM','ANK'],
};

const occasionCategoryPriority: Record<Occasion,string[]> = {
  BIRTHDAY:['EAR','BRA','NEC','CHM'],
  ANNIVERSARY:['NEC','RIN','SET','BRA'],
  MILESTONE:['NEC','SET','RIN','BRA'],
  THANKS:['BRA','EAR','CHM','PEN'],
  JUST_BECAUSE:['NEC','EAR','BRA','RIN','CHM'],
};

function categoryCode(sku:string){ return sku.split('-')[2] ?? 'OTHER'; }
function minPrice(product:CatalogProduct){ return Math.min(...product.units.map(unit=>Number(unit.currentPriceToman))); }

function budgetMatch(price:number,budget:Budget){
  if(budget==='UNDER15')return price<=15_000_000;
  if(budget==='15TO25')return price>15_000_000 && price<=25_000_000;
  if(budget==='OVER25')return price>25_000_000;
  return true;
}

export default function GiftFinder({ products }:{ products:CatalogProduct[] }){
  const [budget,setBudget]=useState<Budget|null>(null);
  const [occasion,setOccasion]=useState<Occasion|null>(null);
  const [recipient,setRecipient]=useState<Recipient|null>(null);

  const ready=Boolean(budget&&occasion&&recipient);

  const recommendations=useMemo(()=>{
    if(!budget||!occasion||!recipient)return [];

    return products
      .filter(product=>product.units.length>0)
      .filter(product=>budgetMatch(minPrice(product),budget))
      .map(product=>{
        const code=categoryCode(product.masterSku);
        const recipientRank=recipientCategoryPriority[recipient].indexOf(code);
        const occasionRank=occasionCategoryPriority[occasion].indexOf(code);
        const recipientScore=recipientRank===-1?0:20-recipientRank*3;
        const occasionScore=occasionRank===-1?0:12-occasionRank*2;
        return { product, score:recipientScore+occasionScore };
      })
      .sort((a,b)=>b.score-a.score || minPrice(a.product)-minPrice(b.product))
      .slice(0,8)
      .map(item=>item.product);
  },[products,budget,occasion,recipient]);

  const budgetLabel=budgetOptions.find(item=>item.value===budget)?.label;
  const occasionLabel=occasionOptions.find(item=>item.value===occasion)?.label;
  const recipientLabel=recipientOptions.find(item=>item.value===recipient)?.label;

  return <>
    <section className={styles.finder}>
      <div className={styles.finderHead}>
        <span>GIFT FINDER</span>
        <h2>هدیه را از چند انتخاب ساده شروع کن.</h2>
        <p>پیشنهادها فقط از محصولاتی ساخته می‌شوند که همین حالا در کاتالوگ EVA موجودند.</p>
      </div>

      <div className={styles.steps}>
        <div className={styles.step}>
          <div className={styles.stepTitle}><span>01</span><div><strong>بودجه</strong><small>محدوده‌ای که راحتی انتخاب کنی</small></div></div>
          <div className={styles.choiceGrid}>
            {budgetOptions.map(option=><button key={option.value} className={budget===option.value?styles.selected:''} onClick={()=>setBudget(option.value)}><strong>{option.label}</strong><small>{option.hint}</small></button>)}
          </div>
        </div>

        <div className={styles.step}>
          <div className={styles.stepTitle}><span>02</span><div><strong>مناسبت</strong><small>حس و موقعیت هدیه</small></div></div>
          <div className={styles.choiceRow}>
            {occasionOptions.map(option=><button key={option.value} className={occasion===option.value?styles.selected:''} onClick={()=>setOccasion(option.value)}>{option.label}</button>)}
          </div>
        </div>

        <div className={styles.step}>
          <div className={styles.stepTitle}><span>03</span><div><strong>برای چه کسی؟</strong><small>برای اولویت‌بندی نوع قطعه</small></div></div>
          <div className={styles.choiceRow}>
            {recipientOptions.map(option=><button key={option.value} className={recipient===option.value?styles.selected:''} onClick={()=>setRecipient(option.value)}>{option.label}</button>)}
          </div>
        </div>
      </div>
    </section>

    <section className={styles.results} id="gift-results">
      <div className={styles.resultsHead}>
        <div><span>YOUR EVA EDIT</span><h2>{ready?'پیشنهادهای ایوا برای تو':'سه انتخاب بالا را کامل کن.'}</h2></div>
        {ready&&<p>{budgetLabel} • {occasionLabel} • {recipientLabel}</p>}
      </div>

      {!ready ? <div className={styles.waiting}>بعد از انتخاب بودجه، مناسبت و گیرنده، پیشنهادهای واقعی موجودی همین‌جا نمایش داده می‌شوند.</div> :
        recommendations.length>0 ? <>
          <p className={styles.logicNote}>بودجه با قیمت واقعی Unitهای موجود کنترل می‌شود؛ مناسبت و گیرنده برای اولویت‌بندی نوع قطعه استفاده می‌شوند.</p>
          <CatalogGrid products={recommendations}/>
        </> : <div className={styles.waiting}><strong>فعلاً در این محدوده محصول موجود نداریم.</strong><span>بودجه را تغییر بده یا همه محصولات را ببین.</span><a href="/shop">مشاهده فروشگاه</a></div>}
    </section>
  </>;
}
