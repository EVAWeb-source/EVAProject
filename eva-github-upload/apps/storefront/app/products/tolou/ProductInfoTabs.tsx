'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './ProductInfoTabs.module.css';

type Spec={label:string;value:string;dir?:'ltr'|'rtl'};
type Props={specs:Spec[];story?:string|null;details?:string|null;dimensions?:string|null;sizeGuide?:string|null;careInstructions?:string|null;packagingNote?:string|null};
type Tab='DETAILS'|'STORY'|'GUIDE';

export default function ProductInfoTabs(props:Props){
  const hasStory=Boolean(props.story);
  const hasGuide=Boolean(props.sizeGuide||props.careInstructions||props.packagingNote);
  const [tab,setTab]=useState<Tab>('DETAILS');
  return <section className={styles.section}>
    <div className={styles.heading}><span>PRODUCT INFORMATION</span><h2>اطلاعات محصول</h2></div>
    <div className={styles.tabs} role="tablist" aria-label="اطلاعات محصول">
      <button role="tab" aria-selected={tab==='DETAILS'} className={tab==='DETAILS'?styles.active:''} onClick={()=>setTab('DETAILS')}>جزئیات محصول</button>
      {hasStory&&<button role="tab" aria-selected={tab==='STORY'} className={tab==='STORY'?styles.active:''} onClick={()=>setTab('STORY')}>داستان محصول</button>}
      {hasGuide&&<button role="tab" aria-selected={tab==='GUIDE'} className={tab==='GUIDE'?styles.active:''} onClick={()=>setTab('GUIDE')}>راهنما و نگهداری</button>}
    </div>
    <div className={styles.panel} role="tabpanel">
      {tab==='DETAILS'&&<div className={styles.details}><dl>{props.specs.map(spec=><div key={spec.label}><dt>{spec.label}</dt><dd dir={spec.dir}>{spec.value}</dd></div>)}</dl>{(props.details||props.dimensions)&&<div className={styles.textBlocks}>{props.details&&<article><strong>توضیحات فنی</strong><p>{props.details}</p></article>}{props.dimensions&&<article><strong>ابعاد / طول</strong><p>{props.dimensions}</p></article>}</div>}</div>}
      {tab==='STORY'&&<article className={styles.story}><p>{props.story}</p></article>}
      {tab==='GUIDE'&&<div className={styles.guide}>{props.sizeGuide&&<article><strong>راهنمای سایز</strong><p>{props.sizeGuide}</p></article>}{props.careInstructions&&<article><strong>مراقبت</strong><p>{props.careInstructions}</p></article>}{props.packagingNote&&<article><strong>بسته‌بندی</strong><p>{props.packagingNote}</p></article>}</div>}
    </div>
  </section>;
}

export function ProductSecondaryLinks(){
  return <section className={styles.secondary}><span>اطلاعات تکمیلی خرید</span><div><Link href="/trust">اصالت و شفافیت</Link><i>•</i><Link href="/shipping-returns">ارسال و مرجوعی</Link></div></section>;
}
