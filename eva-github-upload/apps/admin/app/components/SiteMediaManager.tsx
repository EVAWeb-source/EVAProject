'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SiteMediaManager.module.css';

type Asset={id:string;url:string;originalName:string;mimeType:string;sizeBytes:number;createdAt:string};
type SlotRecord={slot:string;altText:string|null;positionX:number;positionY:number;zoom:number;asset:Asset|null;updatedAt:string};
type MediaPayload={assets:Asset[];slots:SlotRecord[]};
type View='slots'|'library';
type Crop={positionX:number;positionY:number;zoom:number};

const SLOT_DEFINITIONS=[
  {slot:'HOME_HERO_DESKTOP',title:'Hero صفحه اصلی — دسکتاپ',spec:'2400 × 1200 px',ratio:'2:1',hint:'عکس افقی عریض؛ اگر نسبت عکس متفاوت است با کنترل Crop سوژه را دقیق تنظیم کن.'},
  {slot:'HOME_HERO_MOBILE',title:'Hero صفحه اصلی — موبایل',spec:'1080 × 1350 px',ratio:'4:5',hint:'نسخه مستقل موبایل؛ پیشنهاد می‌شود سوژه نزدیک مرکز باشد، اما Crop و Zoom قابل تنظیم است.'},
  {slot:'HOME_STORY',title:'داستان EVA',spec:'1600 × 2000 px',ratio:'4:5',hint:'تصویر ادیتوریال عمودی برای بخش داستان ایوا.'},
  {slot:'COLLECTION_NECKLACES',title:'کالکشن گردنبندها',spec:'1200 × 1500 px',ratio:'4:5',hint:'کارت کالکشن با کادر تمیز و سوژه مرکزی.'},
  {slot:'COLLECTION_EARRINGS',title:'کالکشن گوشواره‌ها',spec:'1200 × 1500 px',ratio:'4:5',hint:'کارت کالکشن با کادر تمیز و سوژه مرکزی.'},
  {slot:'COLLECTION_RINGS',title:'کالکشن انگشترها',spec:'1200 × 1500 px',ratio:'4:5',hint:'کارت کالکشن با کادر تمیز و سوژه مرکزی.'},
  {slot:'COLLECTION_BRACELETS',title:'کالکشن دستبندها',spec:'1200 × 1500 px',ratio:'4:5',hint:'کارت کالکشن با کادر تمیز و سوژه مرکزی.'},
] as const;

export default function SiteMediaManager({view='slots'}:{view?:View}){
  const inputRef=useRef<HTMLInputElement|null>(null);
  const targetSlot=useRef<string>('');
  const [data,setData]=useState<MediaPayload>({assets:[],slots:[]});
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  async function load(){setLoading(true);setError('');try{const response=await fetch('/api/admin/media',{cache:'no-store'});const raw=await response.text();if(!response.ok)throw new Error(raw||'دریافت رسانه‌ها انجام نشد.');setData(JSON.parse(raw));}catch(cause){setError(cause instanceof Error?cause.message:'دریافت رسانه‌ها انجام نشد.');}finally{setLoading(false);}}
  useEffect(()=>{void load();},[]);
  function current(slot:string){return data.slots.find(item=>item.slot===slot)??null;}
  function choose(slot:string){targetSlot.current=slot;inputRef.current?.click();}
  function cropOf(item:SlotRecord|null):Crop{return {positionX:item?.positionX??50,positionY:item?.positionY??50,zoom:item?.zoom??100};}
  function readCrop(slot:string):Crop{
    const x=document.getElementById(`crop-x-${slot}`) as HTMLInputElement|null;
    const y=document.getElementById(`crop-y-${slot}`) as HTMLInputElement|null;
    const zoom=document.getElementById(`crop-z-${slot}`) as HTMLInputElement|null;
    return {positionX:Number(x?.value??50),positionY:Number(y?.value??50),zoom:Number(zoom?.value??100)};
  }
  function refreshPreview(slot:string){
    const image=document.getElementById(`preview-${slot}`) as HTMLImageElement|null;if(!image)return;
    const crop=readCrop(slot);image.style.objectPosition=`${crop.positionX}% ${crop.positionY}%`;image.style.transform=`scale(${crop.zoom/100})`;image.style.transformOrigin=`${crop.positionX}% ${crop.positionY}%`;
    const output=document.getElementById(`crop-values-${slot}`);if(output)output.textContent=`X ${crop.positionX}% · Y ${crop.positionY}% · Zoom ${crop.zoom}%`;
  }

  async function uploadAndAssign(file:File,slot:string){
    setBusy(slot);setMessage('');setError('');
    try{
      const form=new FormData();form.append('file',file);
      const upload=await fetch('/api/admin/media/upload',{method:'POST',body:form});const raw=await upload.text();if(!upload.ok)throw new Error(raw||'آپلود انجام نشد.');
      const asset=JSON.parse(raw) as Asset;
      const altDefault=file.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ');
      const crop=cropOf(current(slot));
      const assign=await fetch('/api/admin/media/slots/'+encodeURIComponent(slot),{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({assetId:asset.id,altText:altDefault,...crop})});
      const assignedRaw=await assign.text();if(!assign.ok)throw new Error(assignedRaw||'اتصال تصویر انجام نشد.');
      setMessage('تصویر با موفقیت آپلود و روی سایت تنظیم شد.');await load();
    }catch(cause){setError(cause instanceof Error?cause.message:'آپلود انجام نشد.');}
    finally{setBusy('');if(inputRef.current)inputRef.current.value='';}
  }

  async function updateSlot(slot:string,assetId:string|null,altText:string,crop:Crop){setBusy(slot);setMessage('');setError('');try{const response=await fetch('/api/admin/media/slots/'+encodeURIComponent(slot),{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({assetId,altText,...crop})});const raw=await response.text();if(!response.ok)throw new Error(raw||'ذخیره انجام نشد.');setMessage(assetId?'متن و کادر تصویر ذخیره شد.':'تصویر این بخش حذف شد.');await load();}catch(cause){setError(cause instanceof Error?cause.message:'ذخیره انجام نشد.');}finally{setBusy('');}}
  async function removeAsset(asset:Asset){if(!window.confirm(`تصویر «${asset.originalName}» از کتابخانه حذف شود؟`))return;setBusy(asset.id);setMessage('');setError('');try{const response=await fetch('/api/admin/media/'+asset.id,{method:'DELETE'});const raw=await response.text();if(!response.ok)throw new Error(raw||'حذف انجام نشد.');setMessage('تصویر از کتابخانه حذف شد.');await load();}catch(cause){setError(cause instanceof Error?cause.message:'این تصویر قابل حذف نیست.');}finally{setBusy('');}}

  if(loading)return <section className={styles.panel}><p className={styles.notice}>در حال دریافت رسانه‌ها...</p></section>;

  return <section className={styles.panel}>
    {view==='slots'&&<input ref={inputRef} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event=>{const file=event.target.files?.[0];if(file&&targetSlot.current)void uploadAndAssign(file,targetSlot.current);}}/>}
    {message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}

    {view==='slots'?<>
      <div className={styles.intro}><div><h2>تصاویر سایت و تنظیم کادر</h2><p>ابعاد پیشنهادی بهترین کیفیت را می‌دهند، اما الزامی نیستند. با X/Y سوژه را جابه‌جا و با Zoom میزان برش را تنظیم کن.</p></div><span>JPG · PNG · WebP · AVIF · Max 10MB</span></div>
      <div className={styles.slotGrid}>{SLOT_DEFINITIONS.map(def=>{const item=current(def.slot);const crop=cropOf(item);return <article className={styles.slotCard} key={def.slot}>
        <div className={styles.preview}>{item?.asset?<img id={`preview-${def.slot}`} src={item.asset.url} alt={item.altText??def.title} style={{objectPosition:`${crop.positionX}% ${crop.positionY}%`,transform:`scale(${crop.zoom/100})`,transformOrigin:`${crop.positionX}% ${crop.positionY}%`}}/>:<span>بدون تصویر</span>}</div>
        <div className={styles.slotBody}><div><strong>{def.title}</strong><div className={styles.specRow}><b>{def.spec}</b><span>{def.ratio}</span></div><small>{def.hint}</small></div>
          <label>Alt Text<input defaultValue={item?.altText??''} id={`alt-${def.slot}`} placeholder="توضیح دقیق تصویر برای دسترسی و SEO"/></label>
          {item?.asset&&<div className={styles.cropBox}><div className={styles.cropHead}><b>تنظیم Crop</b><span id={`crop-values-${def.slot}`}>X {crop.positionX}% · Y {crop.positionY}% · Zoom {crop.zoom}%</span></div>
            <label>حرکت افقی<input id={`crop-x-${def.slot}`} type="range" min="0" max="100" defaultValue={crop.positionX} onInput={()=>refreshPreview(def.slot)}/></label>
            <label>حرکت عمودی<input id={`crop-y-${def.slot}`} type="range" min="0" max="100" defaultValue={crop.positionY} onInput={()=>refreshPreview(def.slot)}/></label>
            <label>زوم<input id={`crop-z-${def.slot}`} type="range" min="100" max="200" defaultValue={crop.zoom} onInput={()=>refreshPreview(def.slot)}/></label>
          </div>}
          <div className={styles.actions}><button className={styles.primary} type="button" disabled={busy===def.slot} onClick={()=>choose(def.slot)}>{busy===def.slot?'در حال انجام...':item?.asset?'جایگزینی عکس':'آپلود عکس'}</button>{item?.asset&&<><button type="button" disabled={busy===def.slot} onClick={()=>{const input=document.getElementById(`alt-${def.slot}`) as HTMLInputElement|null;void updateSlot(def.slot,item.asset!.id,input?.value??'',readCrop(def.slot));}}>ذخیره متن و کادر</button><button className={styles.danger} type="button" disabled={busy===def.slot} onClick={()=>void updateSlot(def.slot,null,'',{positionX:50,positionY:50,zoom:100})}>حذف از بخش</button></>}</div></div>
      </article>;})}</div>
    </>:<>
      <div className={styles.libraryHead}><div><h2>Media Library</h2><p>آرشیو فایل‌های آپلودشده EVA. تصویری که در محصول یا یکی از جایگاه‌های سایت استفاده می‌شود تا زمان آزاد شدن قابل حذف نیست.</p></div><span>{data.assets.length} فایل</span></div>
      {data.assets.length?<div className={styles.libraryGrid}>{data.assets.map(asset=><article className={styles.asset} key={asset.id}><img src={asset.url} alt={asset.originalName}/><div><strong title={asset.originalName}>{asset.originalName}</strong><small>{(asset.sizeBytes/1024/1024).toFixed(2)} MB</small><button type="button" disabled={busy===asset.id} onClick={()=>void removeAsset(asset)}>حذف فایل</button></div></article>)}</div>:<div className={styles.empty}>هنوز تصویری در کتابخانه آپلود نشده است.</div>}
    </>}
  </section>;
}
