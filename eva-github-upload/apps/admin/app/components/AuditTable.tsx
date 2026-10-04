'use client';

import { useMemo, useState } from 'react';

type Item={id:string;actor:string;action:string;entityType:string;entityId:string|null;summary:string;metadata:unknown;createdAt:string};

const labels:Record<string,string>={
  PRODUCT_CREATED:'ساخت محصول',PRODUCT_UPDATED:'ویرایش محصول',PRODUCT_PUBLISHED:'انتشار محصول',PRODUCT_CONTENT_UPDATED:'ویرایش محتوا',BULK_DRAFTS_CREATED:'ساخت گروهی Draft',
  UNIT_CREATED:'ساخت Unit',UNIT_UPDATED:'ویرایش Unit',FULFILLMENT_UPDATED:'تغییر Fulfillment',PRICING_UPDATED:'تغییر قیمت‌گذاری',CUSTOMER_UPDATED:'ویرایش مشتری',
  CANCELLATION_CREATED:'ثبت لغو',RETURN_CREATED:'ثبت مرجوعی',AFTER_SALES_APPROVED:'تأیید After Sales',AFTER_SALES_REJECTED:'رد After Sales',RETURN_RECEIVED:'دریافت مرجوعی',RETURN_QC_COMPLETED:'QC مرجوعی',REFUND_RECORDED:'ثبت بازپرداخت',
};
const typeLabels:Record<string,string>={PRODUCT:'محصول',UNIT:'Unit',ORDER:'سفارش',CUSTOMER:'مشتری',PRICING:'قیمت‌گذاری',AFTER_SALES:'After Sales',CATALOG:'کاتالوگ'};
const date=(value:string)=>new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));

export default function AuditTable({items}:{items:Item[]}){
  const [query,setQuery]=useState('');
  const [type,setType]=useState('ALL');
  const [action,setAction]=useState('ALL');
  const types=useMemo(()=>[...new Set(items.map(item=>item.entityType))].sort(),[items]);
  const actions=useMemo(()=>[...new Set(items.map(item=>item.action))].sort(),[items]);
  const result=useMemo(()=>items.filter(item=>{
    const q=query.trim().toLowerCase();
    const text=[item.summary,item.action,item.entityType,item.entityId].filter(Boolean).join(' ').toLowerCase();
    return (!q||text.includes(q))&&(type==='ALL'||item.entityType===type)&&(action==='ALL'||item.action===action);
  }),[items,query,type,action]);

  return <section className="panel">
    <div className="v2Toolbar">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در فعالیت‌ها"/>
      <select value={type} onChange={e=>setType(e.target.value)}><option value="ALL">همه بخش‌ها</option>{types.map(value=><option key={value} value={value}>{typeLabels[value]??value}</option>)}</select>
      <select value={action} onChange={e=>setAction(e.target.value)}><option value="ALL">همه عملیات‌ها</option>{actions.map(value=><option key={value} value={value}>{labels[value]??value}</option>)}</select>
      <span>{new Intl.NumberFormat('fa-IR').format(result.length)} رویداد</span>
    </div>
    <div className="tableWrap"><table><thead><tr><th>زمان</th><th>عملیات</th><th>بخش</th><th>شرح</th><th>شناسه</th></tr></thead><tbody>
      {result.map(item=><tr key={item.id}><td>{date(item.createdAt)}</td><td><strong>{labels[item.action]??item.action}</strong></td><td>{typeLabels[item.entityType]??item.entityType}</td><td>{item.summary}</td><td><small dir="ltr">{item.entityId??'—'}</small></td></tr>)}
      {result.length===0&&<tr><td colSpan={5}>رویدادی با این فیلتر پیدا نشد.</td></tr>}
    </tbody></table></div>
  </section>;
}
