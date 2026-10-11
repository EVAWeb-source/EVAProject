'use client';

import { useMemo, useState } from 'react';
import type { CustomerListData } from '../lib/admin-data';
import AdminFilterMenu, { type AdminFilterOption } from './AdminFilterMenu';
import styles from './CustomersTable.module.css';

type Item = CustomerListData['items'][number];
type Mode = 'ALL'|'REPEAT'|'PAID';

const modeOptions:AdminFilterOption[]=[
  {value:'ALL',label:'همه مشتری‌ها'},
  {value:'PAID',label:'خریدار',note:'حداقل یک سفارش پرداخت‌شده'},
  {value:'REPEAT',label:'مشتری تکراری',note:'بیش از یک سفارش'},
];

function fa(value:number){return new Intl.NumberFormat('fa-IR').format(value);}
function toman(value:number){return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;}
function date(value:string|null){return value?new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium'}).format(new Date(value)):'—';}

export default function CustomersTable({data}:{data:CustomerListData}){
  const [query,setQuery]=useState('');
  const [mode,setMode]=useState<Mode>('ALL');
  const items=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return data.items.filter((item:Item)=>{
      const matches=!q||item.mobile.toLowerCase().includes(q)||(item.name??'').toLowerCase().includes(q);
      if(!matches)return false;
      if(mode==='REPEAT')return item.orderCount>1;
      if(mode==='PAID')return item.paidOrderCount>0;
      return true;
    });
  },[data.items,query,mode]);
  const filtersActive=Boolean(query)||mode!=='ALL';
  const clearFilters=()=>{setQuery('');setMode('ALL');};

  return <section className={styles.wrap}>
    <div className={styles.summary}>
      <div><span>کل مشتری‌ها</span><strong>{fa(data.summary.total)}</strong></div>
      <div><span>دارای سفارش</span><strong>{fa(data.summary.withOrders)}</strong></div>
      <div><span>مشتری تکراری</span><strong>{fa(data.summary.repeatCustomers)}</strong></div>
      <div><span>خرید پرداخت‌شده</span><strong>{toman(data.summary.totalPaidToman)}</strong></div>
    </div>

    <div className={styles.filterBar}>
      <div className={styles.filterHead}>
        <div><strong>فیلتر مشتری‌ها</strong><small>نام، موبایل یا نوع مشتری را انتخاب کن.</small></div>
        <div className={styles.filterMeta}><span>{fa(items.length)} مشتری</span>{filtersActive&&<button type="button" onClick={clearFilters}>پاک کردن فیلترها</button>}</div>
      </div>
      <div className={styles.filterGrid}>
        <label className={styles.searchField}><span>جستجو</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="نام یا شماره موبایل" /></label>
        <div className={styles.filterMenu}><AdminFilterMenu label="نوع مشتری" value={mode} options={modeOptions} onChange={(value)=>setMode(value as Mode)}/></div>
      </div>
    </div>

    <div className={styles.tableWrap}><table><thead><tr><th>مشتری</th><th>موبایل</th><th>سفارش</th><th>پرداخت‌شده</th><th>مجموع خرید</th><th>آخرین سفارش</th><th></th></tr></thead><tbody>
      {items.map((item:Item)=><tr key={item.id}><td><strong>{item.name||'بدون نام'}</strong>{item.internalNote&&<small>یادداشت داخلی دارد</small>}</td><td dir="ltr">{item.mobile}</td><td>{fa(item.orderCount)}</td><td>{fa(item.paidOrderCount)}</td><td>{toman(item.totalPaidToman)}</td><td>{date(item.lastOrderAt)}</td><td><a href={`/customers/${item.id}`}>پروفایل ←</a></td></tr>)}
      {items.length===0&&<tr><td colSpan={7} className={styles.empty}>مشتری مطابق این فیلتر پیدا نشد.</td></tr>}
    </tbody></table></div>
  </section>;
}
