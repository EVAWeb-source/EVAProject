'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import styles from './AfterSalesPanel.module.css';

type CaseItem={
  id:string;
  type:'CANCELLATION'|'RETURN';
  status:string;
  reason:string;
  note:string|null;
  refundAmountToman:number|null;
  refundReference:string|null;
  qcOutcome:string|null;
  requestedAt:string;
  approvedAt:string|null;
  receivedAt:string|null;
  qcCompletedAt:string|null;
  refundedAt:string|null;
  rejectedAt:string|null;
  order:{id:string;orderNumber:string;status:string;fulfillmentStatus:string;customerName:string;mobile:string;totalToman:number;invoiceNumber:string|null;invoiceStatus:string|null;paymentStatus:string|null};
  unit:{id:string;unitSku:string;status:string;productNameFa:string;exactWeightGram:string};
};
type Data={generatedAt:string;summary:{total:number;requested:number;refundPending:number;qcPending:number};items:CaseItem[]};

const labels:Record<string,string>={
  CANCELLATION:'لغو سفارش',RETURN:'مرجوعی',REQUESTED:'درخواست ثبت‌شده',RETURN_IN_TRANSIT:'در مسیر بازگشت',QC_PENDING:'در انتظار QC',REFUND_PENDING:'در انتظار بازپرداخت',COMPLETED:'تکمیل‌شده',REJECTED:'ردشده',
  PAID:'پرداخت‌شده',PENDING_PAYMENT:'در انتظار پرداخت',CANCELLED:'لغوشده',REFUNDED:'بازپرداخت‌شده',AVAILABLE:'موجود',SOLD:'فروخته‌شده',RETURNED:'مرجوع‌شده',QUALITY_HOLD:'توقف QC',DAMAGED:'آسیب‌دیده',UNAVAILABLE:'غیرقابل فروش',
};
const toman=(v:number|null)=>v===null?'—':new Intl.NumberFormat('fa-IR').format(v)+' تومان';
const fa=(v:number)=>new Intl.NumberFormat('fa-IR').format(v);
const date=(v:string|null)=>v?new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'—';

async function request(path:string,method:'GET'|'PATCH'='GET',payload?:Record<string,unknown>){
  const response=await fetch('/api/admin/'+path,{method,headers:payload?{'content-type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined,cache:'no-store'});
  const raw=await response.text();
  if(!response.ok){
    try{const parsed=JSON.parse(raw);throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));}
    catch(error){if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;throw new Error(raw||`HTTP ${response.status}`);}
  }
  return raw?JSON.parse(raw):null;
}

export default function AfterSalesPanel(){
  const [data,setData]=useState<Data|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [filter,setFilter]=useState<'OPEN'|'ALL'|'COMPLETED'>('OPEN');

  const load=useCallback(async()=>{
    setLoading(true);
    try{setData(await request('after-sales'));setError('');}
    catch(cause){setError(cause instanceof Error?cause.message:'دریافت پرونده‌ها انجام نشد.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);

  const items=useMemo(()=>{
    const list=data?.items??[];
    if(filter==='ALL')return list;
    if(filter==='COMPLETED')return list.filter(item=>item.status==='COMPLETED'||item.status==='REJECTED');
    return list.filter(item=>item.status!=='COMPLETED'&&item.status!=='REJECTED');
  },[data,filter]);

  async function action(id:string,path:string,payload?:Record<string,unknown>,success='انجام شد.'){
    setBusy(id+path);setError('');setMessage('');
    try{await request(`after-sales/${id}/${path}`,'PATCH',payload);setMessage(success);await load();}
    catch(cause){setError(cause instanceof Error?cause.message:'عملیات انجام نشد.');}
    finally{setBusy('');}
  }

  function QcForm({item}:{item:CaseItem}){
    async function submit(event:FormEvent<HTMLFormElement>){
      event.preventDefault();const form=new FormData(event.currentTarget);
      await action(item.id,'qc',{outcome:form.get('outcome'),note:form.get('note')},'نتیجه QC ثبت شد.');
    }
    return <form className={styles.inlineForm} onSubmit={submit}>
      <label>نتیجه QC<select name="outcome" defaultValue="AVAILABLE"><option value="AVAILABLE">تأیید؛ قابل فروش</option><option value="QUALITY_HOLD">نیازمند بررسی بیشتر</option><option value="DAMAGED">آسیب‌دیده</option><option value="UNAVAILABLE">غیرقابل فروش</option></select></label>
      <label>یادداشت<input name="note" placeholder="اختیاری"/></label>
      <button disabled={Boolean(busy)}>ثبت QC</button>
    </form>;
  }

  function RefundForm({item}:{item:CaseItem}){
    async function submit(event:FormEvent<HTMLFormElement>){
      event.preventDefault();const form=new FormData(event.currentTarget);
      await action(item.id,'refund',{refundReference:form.get('refundReference')},'بازپرداخت به‌صورت عملیاتی ثبت شد.');
    }
    return <form className={styles.inlineForm} onSubmit={submit}>
      <label>مرجع بازپرداخت<input name="refundReference" dir="ltr" required placeholder="MANUAL-REFUND-..."/></label>
      <button disabled={Boolean(busy)}>ثبت بازپرداخت</button>
      <small>این دکمه پول واقعی جابه‌جا نمی‌کند؛ فقط ثبت عملیاتی است تا درگاه واقعی متصل شود.</small>
    </form>;
  }

  return <section className={styles.wrap}>
    {data&&<div className={styles.summary}>
      <article><span>کل پرونده‌ها</span><strong>{fa(data.summary.total)}</strong></article>
      <article><span>در انتظار تصمیم</span><strong>{fa(data.summary.requested)}</strong></article>
      <article><span>بازپرداخت معلق</span><strong>{fa(data.summary.refundPending)}</strong></article>
      <article><span>در انتظار QC</span><strong>{fa(data.summary.qcPending)}</strong></article>
    </div>}

    <div className={styles.toolbar}><div><button className={filter==='OPEN'?styles.active:''} onClick={()=>setFilter('OPEN')}>باز</button><button className={filter==='ALL'?styles.active:''} onClick={()=>setFilter('ALL')}>همه</button><button className={filter==='COMPLETED'?styles.active:''} onClick={()=>setFilter('COMPLETED')}>بسته‌شده</button></div><button onClick={()=>void load()}>↻ بروزرسانی</button></div>
    {message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}{loading&&<div className={styles.notice}>در حال دریافت پرونده‌های لغو و مرجوعی...</div>}

    {!loading&&items.length===0&&<div className={styles.empty}>در این بخش پرونده‌ای وجود ندارد.</div>}
    <div className={styles.list}>{items.map(item=><article className={styles.card} key={item.id}>
      <div className={styles.head}><div><span>{labels[item.type]??item.type}</span><h2>{item.order.orderNumber}</h2><small>{item.unit.productNameFa} • <b dir="ltr">{item.unit.unitSku}</b></small></div><div className={`${styles.status} ${styles['s_'+item.status.toLowerCase()]??''}`}>{labels[item.status]??item.status}</div></div>
      <div className={styles.meta}><div><span>مشتری</span><strong>{item.order.customerName}</strong><small dir="ltr">{item.order.mobile}</small></div><div><span>مبلغ</span><strong>{toman(item.refundAmountToman)}</strong></div><div><span>وضعیت سفارش</span><strong>{labels[item.order.status]??item.order.status}</strong></div><div><span>وضعیت Unit</span><strong>{labels[item.unit.status]??item.unit.status}</strong></div></div>
      <div className={styles.reason}><span>دلیل</span><p>{item.reason}</p>{item.note&&<small>{item.note}</small>}</div>
      <div className={styles.dates}><span>ثبت: {date(item.requestedAt)}</span>{item.approvedAt&&<span>تأیید: {date(item.approvedAt)}</span>}{item.receivedAt&&<span>دریافت: {date(item.receivedAt)}</span>}{item.refundedAt&&<span>بازپرداخت: {date(item.refundedAt)}</span>}</div>

      {item.status==='REQUESTED'&&<div className={styles.actions}><button className={styles.primary} disabled={Boolean(busy)} onClick={()=>action(item.id,'approve',undefined,'پرونده تأیید شد.')}>تأیید</button><button disabled={Boolean(busy)} onClick={()=>action(item.id,'reject',{note:'رد توسط مدیر'},'پرونده رد شد.')}>رد درخواست</button></div>}
      {item.status==='RETURN_IN_TRANSIT'&&<div className={styles.actions}><button className={styles.primary} disabled={Boolean(busy)} onClick={()=>action(item.id,'received',undefined,'دریافت کالای مرجوعی ثبت شد؛ Unit وارد QC شد.')}>کالا دریافت شد</button></div>}
      {item.status==='QC_PENDING'&&<QcForm item={item}/>} 
      {item.status==='REFUND_PENDING'&&<RefundForm item={item}/>} 
      {(item.status==='COMPLETED'||item.status==='REJECTED')&&<div className={styles.closed}>{item.status==='COMPLETED'?'✓ پرونده تکمیل شده است.':'این درخواست رد شده است.'}{item.qcOutcome&&<span> نتیجه QC: {labels[item.qcOutcome]??item.qcOutcome}</span>}</div>}
      <div className={styles.footer}><a href={`/orders/${item.order.id}`}>باز کردن سفارش ←</a>{item.refundReference&&<span dir="ltr">Refund: {item.refundReference}</span>}</div>
    </article>)}</div>
  </section>;
}
