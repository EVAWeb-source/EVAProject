'use client';

import { useMemo, useState } from 'react';
import type { CustomerListData } from '../lib/admin-data';
import styles from './CustomersTable.module.css';

type Item = CustomerListData['items'][number];

function fa(value:number){return new Intl.NumberFormat('fa-IR').format(value);}
function toman(value:number){return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;}
function date(value:string|null){return value?new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium'}).format(new Date(value)):'—';}

export default function CustomersTable({data}:{data:CustomerListData}){
  const [query,setQuery]=useState('');
  const [mode,setMode]=useState<'ALL'|'REPEAT'|'PAID'>('ALL');
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

  return <section className={styles.wrap}>
    <div className={styles.summary}>
      <div><span>کل مشتری‌ها</span><strong>{fa(data.summary.total)}</strong></div>
      <div><span>دارای سفارش</span><strong>{fa(data.summary.withOrders)}</strong></div>
      <div><span>مشتری تکراری</span><strong>{fa(data.summary.repeatCustomers)}</strong></div>
      <div><span>خرید پرداخت‌شده</span><strong>{toman(data.summary.totalPaidToman)}</strong></div>
    </div>
    <div className={styles.toolbar}>
      <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="جستجو با نام یا موبایل" />
      <div className={styles.filters}><button className={mode==='ALL'?styles.active:''} onClick={()=>setMode('ALL')}>همه</button><button className={mode==='PAID'?styles.active:''} onClick={()=>setMode('PAID')}>خریدار</button><button className={mode==='REPEAT'?styles.active:''} onClick={()=>setMode('REPEAT')}>تکراری</button></div>
    </div>
    <div className={styles.tableWrap}><table><thead><tr><th>مشتری</th><th>موبایل</th><th>سفارش</th><th>پرداخت‌شده</th><th>مجموع خرید</th><th>آخرین سفارش</th><th></th></tr></thead><tbody>
      {items.map((item:Item)=><tr key={item.id}><td><strong>{item.name||'بدون نام'}</strong>{item.internalNote&&<small>یادداشت داخلی دارد</small>}</td><td dir="ltr">{item.mobile}</td><td>{fa(item.orderCount)}</td><td>{fa(item.paidOrderCount)}</td><td>{toman(item.totalPaidToman)}</td><td>{date(item.lastOrderAt)}</td><td><a href={`/customers/${item.id}`}>پروفایل ←</a></td></tr>)}
      {items.length===0&&<tr><td colSpan={7} className={styles.empty}>مشتری مطابق این فیلتر پیدا نشد.</td></tr>}
    </tbody></table></div>
  </section>;
}
