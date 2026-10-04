'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CatalogOnboardingPanel.module.css';

type Collection = { id:string; nameFa:string; slug:string; code:string };
type Checks = { product:boolean; collection:boolean; content:boolean; media:boolean; seo:boolean; inventory:boolean; published:boolean };
type ReadinessItem = {
  id:string;
  nameFa:string;
  slug:string;
  masterSku:string;
  purity:number;
  status:string;
  collectionId:string|null;
  collection:{id:string;nameFa:string;slug:string;code:string}|null;
  imageCount:number;
  availableUnitCount:number;
  unitCount:number;
  checks:Checks;
  completedSteps:number;
  totalSteps:number;
  readyToPublish:boolean;
  missing:string[];
};
type Readiness = {
  summary:{total:number;active:number;readyToPublish:number;needsContent:number;needsMedia:number;needsSeo:number;needsInventory:number};
  items:ReadinessItem[];
};
type Blueprint = { nameFa:string; slug:string; masterSku:string; category:string };
type BulkDraftResult = { planned:number; createdCount:number; existingCount:number; conflictCount:number; conflicts:Array<{nameFa:string;reason:string}> };

const aghaz:Blueprint[] = [
  {nameFa:'طلوع',slug:'tolou',masterSku:'EVA-AGH-NEC-TOL-001',category:'گردنبند'},
  {nameFa:'افق',slug:'ofogh',masterSku:'EVA-AGH-NEC-OFG-002',category:'گردنبند'},
  {nameFa:'بامداد',slug:'bamdad',masterSku:'EVA-AGH-NEC-BMD-003',category:'گردنبند'},
  {nameFa:'مسیر',slug:'masir',masterSku:'EVA-AGH-RIN-MAS-004',category:'انگشتر'},
  {nameFa:'آستانه',slug:'astaneh',masterSku:'EVA-AGH-RIN-AST-005',category:'انگشتر'},
  {nameFa:'نقطه',slug:'noghteh',masterSku:'EVA-AGH-RIN-NOG-006',category:'انگشتر'},
  {nameFa:'راه',slug:'rah',masterSku:'EVA-AGH-BRA-RAH-007',category:'دستبند'},
  {nameFa:'گام',slug:'gam',masterSku:'EVA-AGH-BRA-GAM-008',category:'دستبند'},
  {nameFa:'جهت',slug:'jahat',masterSku:'EVA-AGH-BRA-JHT-009',category:'دستبند'},
  {nameFa:'روشن',slug:'roshan',masterSku:'EVA-AGH-EAR-ROS-010',category:'گوشواره'},
  {nameFa:'نوا',slug:'nava',masterSku:'EVA-AGH-EAR-NVA-011',category:'گوشواره'},
  {nameFa:'دم',slug:'dam',masterSku:'EVA-AGH-EAR-DAM-012',category:'گوشواره'},
  {nameFa:'فردا',slug:'farda',masterSku:'EVA-AGH-SET-FRD-013',category:'ست'},
  {nameFa:'رویش',slug:'rooyesh',masterSku:'EVA-AGH-SET-ROY-014',category:'ست'},
  {nameFa:'پروا',slug:'parva',masterSku:'EVA-AGH-SET-PRV-015',category:'ست'},
];

const stepLabels:Array<[keyof Checks,string]> = [
  ['product','محصول'],['collection','کالکشن'],['content','محتوا'],['media','تصویر'],['seo','SEO'],['inventory','Unit'],['published','انتشار'],
];

function fa(value:number){return new Intl.NumberFormat('fa-IR').format(value);}

async function request(path:string, method:'GET'|'POST'|'PATCH'='GET', payload?:Record<string,unknown>){
  const response=await fetch('/api/admin/'+path,{method,headers:payload?{'content-type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined,cache:'no-store'});
  const raw=await response.text();
  if(!response.ok){
    try{
      const parsed=JSON.parse(raw);
      const message=Array.isArray(parsed.message)?parsed.message.join('، '):parsed.message;
      throw new Error(message||parsed.error||`HTTP ${response.status}`);
    }catch(error){
      if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;
      throw new Error(raw||`HTTP ${response.status}`);
    }
  }
  return raw?JSON.parse(raw):null;
}

export default function CatalogOnboardingPanel({collections}:{collections:Collection[]}){
  const router=useRouter();
  const [data,setData]=useState<Readiness|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [bulkResult,setBulkResult]=useState<BulkDraftResult|null>(null);
  const [view,setView]=useState<'AGHAZ'|'ALL'>('AGHAZ');

  const load=useCallback(async()=>{
    setLoading(true);
    try{setData(await request('catalog-readiness'));setError('');}
    catch(cause){setError(cause instanceof Error?cause.message:'دریافت وضعیت کاتالوگ انجام نشد.');}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{
    void load();
    const refresh=()=>{void load();};
    window.addEventListener('eva-admin-catalog-change',refresh);
    return()=>window.removeEventListener('eva-admin-catalog-change',refresh);
  },[load]);

  const bySku=useMemo(()=>new Map((data?.items??[]).map(item=>[item.masterSku,item])),[data]);
  const blueprintSkus=useMemo(()=>new Set(aghaz.map(item=>item.masterSku)),[]);
  const otherProducts=useMemo(()=>(data?.items??[]).filter(item=>!blueprintSkus.has(item.masterSku)),[data,blueprintSkus]);
  const aghazCollection=collections.find(collection=>collection.slug==='aghaz'||collection.code==='AGH');
  const aghazCreated=aghaz.filter(item=>bySku.has(item.masterSku)).length;
  const aghazRemaining=aghaz.length-aghazCreated;
  const aghazPercent=Math.round((aghazCreated/aghaz.length)*100);

  async function createDraft(item:Blueprint){
    if(!aghazCollection){setError('کالکشن «آغاز» در دیتابیس پیدا نشد.');return;}
    setBusy(item.masterSku);setMessage('');setError('');setBulkResult(null);
    try{
      await request('products','POST',{nameFa:item.nameFa,slug:item.slug,masterSku:item.masterSku,purity:18,collectionId:aghazCollection.id,status:'DRAFT'});
      setMessage(`پیش‌نویس «${item.nameFa}» ساخته شد.`);
      await load();
      router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:'ساخت محصول انجام نشد.');}
    finally{setBusy('');}
  }

  async function createAllDrafts(){
    if(busy)return;
    setBusy('AGHAZ_BULK');setMessage('');setError('');setBulkResult(null);
    try{
      const result:BulkDraftResult=await request('catalog-readiness/aghaz/drafts','POST');
      setBulkResult(result);
      setMessage(result.createdCount>0
        ? `${fa(result.createdCount)} Draft جدید ساخته شد؛ ${fa(result.existingCount)} محصول از قبل وجود داشت.`
        : `همه Master Productهای آغاز از قبل در دیتابیس وجود داشتند.`);
      if(result.conflictCount>0){
        setError(`${fa(result.conflictCount)} مورد تعارض Slug/SKU پیدا شد؛ هیچ داده موجودی بازنویسی نشد.`);
      }
      await load();
      window.dispatchEvent(new Event('eva-admin-catalog-change'));
      router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:'ساخت گروهی Draftها انجام نشد.');}
    finally{setBusy('');}
  }

  async function publish(item:ReadinessItem){
    setBusy(item.id);setMessage('');setError('');setBulkResult(null);
    try{
      await request(`catalog-readiness/${item.id}/publish`,'PATCH');
      setMessage(`«${item.nameFa}» با موفقیت منتشر شد و وارد کاتالوگ فروش شد.`);
      await load();
      router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:'انتشار محصول انجام نشد.');}
    finally{setBusy('');}
  }

  function openContent(productId:string){ window.location.href=`/catalog/products/${productId}`; }
  function openUnits(productId:string){ window.location.href=`/inventory?productId=${encodeURIComponent(productId)}`; }

  function nextAction(item:ReadinessItem){
    if(!item.checks.content||!item.checks.media||!item.checks.seo)return <button className={styles.secondary} onClick={()=>openContent(item.id)}>تکمیل محصول</button>;
    if(!item.checks.inventory)return <button className={styles.secondary} onClick={()=>openUnits(item.id)}>افزودن Unit موجود</button>;
    if(item.readyToPublish&&item.status!=='ACTIVE')return <button className={styles.publish} disabled={busy===item.id} onClick={()=>publish(item)}>{busy===item.id?'در حال انتشار...':'Publish محصول'}</button>;
    if(item.status==='ACTIVE')return <span className={styles.live}>LIVE</span>;
    return null;
  }

  function ReadinessCard({blueprint,item}:{blueprint?:Blueprint;item?:ReadinessItem}){
    const title=item?.nameFa??blueprint?.nameFa??'—';
    const sku=item?.masterSku??blueprint?.masterSku??'';
    const category=blueprint?.category??'محصول EVA';
    const done=item?.completedSteps??0;
    const total=item?.totalSteps??7;
    const percent=Math.round((done/total)*100);
    return <article className={styles.card}>
      <div className={styles.cardTop}><div><span>{category}</span><h4>{title}</h4><small dir="ltr">{sku}</small></div><div className={item?.status==='ACTIVE'?styles.statusLive:styles.status}>{item?.status==='ACTIVE'?'فعال':item?'Draft / آماده‌سازی':'ساخته نشده'}</div></div>
      <div className={styles.progressRow}><strong>{fa(done)} / {fa(total)}</strong><div className={styles.progress}><i style={{width:`${percent}%`}}/></div><span>{fa(percent)}٪</span></div>
      <div className={styles.steps}>{stepLabels.map(([key,label])=><span className={item?.checks[key]?styles.stepDone:styles.step} key={key}>{item?.checks[key]?'✓':'○'} {label}</span>)}</div>
      {item&&<div className={styles.facts}><span>{fa(item.imageCount)} تصویر</span><span>{fa(item.unitCount)} Unit</span><span>{fa(item.availableUnitCount)} موجود</span></div>}
      <div className={styles.cardActions}>{!item&&blueprint?<button className={styles.create} disabled={Boolean(busy)} onClick={()=>createDraft(blueprint)}>{busy===blueprint.masterSku?'در حال ساخت...':'ساخت Draft'}</button>:item?nextAction(item):null}</div>
    </article>;
  }

  return <section id="catalog-onboarding" className={styles.panel}>
    <div className={styles.head}><div><span>CATALOG ONBOARDING</span><h3>آماده‌سازی محصولات برای فروش</h3><p>هر محصول باید قبل از Publish هویت، محتوا، تصویر اصلی، SEO و حداقل یک Unit موجود داشته باشد.</p></div><div className={styles.tabs}><button className={view==='AGHAZ'?styles.tabActive:''} onClick={()=>setView('AGHAZ')}>کالکشن آغاز</button><button className={view==='ALL'?styles.tabActive:''} onClick={()=>setView('ALL')}>همه محصولات</button></div></div>
    {data&&<div className={styles.summary}><div><span>کل محصولات</span><strong>{fa(data.summary.total)}</strong></div><div><span>فعال</span><strong>{fa(data.summary.active)}</strong></div><div><span>آماده Publish</span><strong>{fa(data.summary.readyToPublish)}</strong></div><div><span>محتوای ناقص</span><strong>{fa(data.summary.needsContent)}</strong></div><div><span>بدون تصویر اصلی</span><strong>{fa(data.summary.needsMedia)}</strong></div><div><span>بدون Unit موجود</span><strong>{fa(data.summary.needsInventory)}</strong></div></div>}
    {message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}{loading&&<div className={styles.notice}>در حال بررسی آمادگی کاتالوگ...</div>}
    {bulkResult&&bulkResult.conflicts.length>0&&<div className={styles.conflicts}><strong>تعارض‌ها</strong>{bulkResult.conflicts.map(item=><span key={item.nameFa}>{item.nameFa}: {item.reason}</span>)}</div>}
    {!loading&&view==='AGHAZ'&&<>
      <div className={styles.collectionIntro}>
        <div className={styles.collectionCopy}><strong>آغاز</strong><span>۱۵ Master Product برنامه‌ریزی‌شده</span><p>اول اسکلت همه محصولات را به‌صورت Draft می‌سازیم؛ بعد محتوا، تصاویر و Unit واقعی هر محصول تکمیل می‌شود.</p></div>
        <div className={styles.batchActions}>
          <div className={styles.batchProgress}><div><strong>{fa(aghazCreated)} / {fa(aghaz.length)}</strong><span>Master Product ساخته شده</span></div><div className={styles.batchTrack}><i style={{width:`${aghazPercent}%`}}/></div></div>
          {aghazRemaining>0?<button onClick={createAllDrafts} disabled={Boolean(busy)}>{busy==='AGHAZ_BULK'?'در حال ساخت Draftها...':`ساخت ${fa(aghazRemaining)} Draft باقی‌مانده`}</button>:<span className={styles.batchDone}>✓ اسکلت کالکشن کامل است</span>}
        </div>
      </div>
      <div className={styles.grid}>{aghaz.map(blueprint=><ReadinessCard key={blueprint.masterSku} blueprint={blueprint} item={bySku.get(blueprint.masterSku)}/>)}</div>
    </>}
    {!loading&&view==='ALL'&&<>{(data?.items.length??0)>0?<div className={styles.grid}>{data?.items.map(item=><ReadinessCard key={item.id} item={item}/>)}</div>:<div className={styles.notice}>هنوز محصولی در دیتابیس ساخته نشده است.</div>}{otherProducts.length>0&&<p className={styles.hint}>محصولاتی که خارج از Blueprint آغاز ساخته می‌شوند هم خودکار وارد همین Readiness می‌شوند.</p>}</>}
  </section>;
}
