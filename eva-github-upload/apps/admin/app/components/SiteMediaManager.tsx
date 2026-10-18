'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SiteMediaManager.module.css';

type Asset={id:string;url:string;originalName:string;mimeType:string;sizeBytes:number;createdAt:string};
type SlotRecord={slot:string;altText:string|null;positionX:number;positionY:number;zoom:number;asset:Asset|null;updatedAt:string};
type MediaPayload={assets:Asset[];slots:SlotRecord[]};
type View='slots'|'library';
type Crop={positionX:number;positionY:number;zoom:number};

const SLOT_DEFINITIONS=[
  {slot:'HOME_HERO_DESKTOP',title:'Hero صفحه اصلی — دسکتاپ',spec:'2400 × 1200 px',ratio:'2:1',aspect:'2 / 1',hint:'عکس افقی عریض؛ خروجی سمت چپ دقیقاً با نسبت Hero دسکتاپ نمایش داده می‌شود.'},
  {slot:'HOME_HERO_MOBILE',title:'Hero صفحه اصلی — موبایل',spec:'1080 × 1350 px',ratio:'4:5',aspect:'4 / 5',hint:'نسخه مستقل موبایل؛ خروجی دقیقاً با نسبت Hero موبایل نمایش داده می‌شود.'},
  {slot:'HOME_STORY',title:'داستان EVA',spec:'1600 × 2000 px',ratio:'4:5',aspect:'4 / 5',hint:'تصویر ادیتوریال عمودی؛ خروجی با همان نسبت بخش داستان نمایش داده می‌شود.'},
  {slot:'COLLECTION_NECKLACES',title:'کالکشن گردنبندها',spec:'1200 × 1500 px',ratio:'4:5',aspect:'4 / 5',hint:'خروجی با نسبت کارت کالکشن روی سایت نمایش داده می‌شود.'},
  {slot:'COLLECTION_EARRINGS',title:'کالکشن گوشواره‌ها',spec:'1200 × 1500 px',ratio:'4:5',aspect:'4 / 5',hint:'خروجی با نسبت کارت کالکشن روی سایت نمایش داده می‌شود.'},
  {slot:'COLLECTION_RINGS',title:'کالکشن انگشترها',spec:'1200 × 1500 px',ratio:'4:5',aspect:'4 / 5',hint:'خروجی با نسبت کارت کالکشن روی سایت نمایش داده می‌شود.'},
  {slot:'COLLECTION_BRACELETS',title:'کالکشن دستبندها',spec:'1200 × 1500 px',ratio:'4:5',aspect:'4 / 5',hint:'خروجی با نسبت کارت کالکشن روی سایت نمایش داده می‌شود.'},
] as const;

export default function SiteMediaManager({view='slots'}:{view?:View}){
  const inputRef=useRef<HTMLInputElement|null>(null);
  const targetSlot=useRef<string>('');
  const [data,setData]=useState<MediaPayload>({assets:[],slots:[]});
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [previewSlot,setPreviewSlot]=useState<string|null>(null);

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
  function applyCrop(image:HTMLImageElement|null,crop:Crop){if(!image)return;image.style.objectPosition=`${crop.positionX}% ${crop.positionY}%`;image.style.transform=`scale(${crop.zoom/100})`;image.style.transformOrigin=`${crop.positionX}% ${crop.positionY}%`;}
  function refreshPreview(slot:string){
    const crop=readCrop(slot);
    applyCrop(document.getElementById(`preview-${slot}`) as HTMLImageElement|null,crop);
    applyCrop(document.getElementById(`modal-preview-${slot}`) as HTMLImageElement|null,crop);
    const output=document.getElementById(`crop-values-${slot}`);if(output)output.textContent=`X ${crop.positionX}% · Y ${crop.positionY}% · Zoom ${crop.zoom}%`;
    const modalOutput=document.getElementById(`modal-crop-values-${slot}`);if(modalOutput)modalOutput.textContent=`X ${crop.positionX}% · Y ${crop.positionY}% · Zoom ${crop.zoom}%`;
  }
  function setCropValue(slot:string,key:'x'|'y'|'z',value:number){
    const input=document.getElementById(`crop-${key}-${slot}`) as HTMLInputElement|null;
    if(input)input.value=String(value);
    refreshPreview(slot);
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

  const modalDef=previewSlot?SLOT_DEFINITIONS.find(def=>def.slot===previewSlot)??null:null;
  const modalItem=previewSlot?current(previewSlot):null;
  const modalCrop=cropOf(modalItem);

  return <section className={styles.panel}>
    {view==='slots'&&<input ref={inputRef} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event=>{const file=event.target.files?.[0];if(file&&targetSlot.current)void uploadAndAssign(file,targetSlot.current);}}/>}
    {message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}

    {view==='slots'?<>
      <div className={styles.intro}><div><h2>تصاویر سایت و تنظیم کادر</h2><p>برای هر بخش هم «عکس کامل» را می‌بینی و هم «خروجی واقعی سایت». اسلایدرها فقط خروجی سایت را تغییر می‌دهند.</p></div><span>JPG · PNG · WebP · AVIF · Max 10MB</span></div>
      <div className={styles.slotGrid}>{SLOT_DEFINITIONS.map(def=>{const item=current(def.slot);const crop=cropOf(item);return <article className={styles.slotCard} key={def.slot}>
        <div className={styles.cardHead}><div><strong>{def.title}</strong><div className={styles.specRow}><b>{def.spec}</b><span>{def.ratio}</span></div><small>{def.hint}</small></div></div>

        {item?.asset?<div className={styles.previewWorkspace}>
          <div className={styles.previewBlock}>
            <div className={styles.previewTitle}><b>عکس کامل</b><span>بدون برش</span></div>
            <div className={styles.sourcePreview}><img src={item.asset.url} alt={item.altText??def.title}/></div>
          </div>
          <div className={styles.previewBlock}>
            <div className={styles.previewTitle}><b>خروجی واقعی سایت</b><span>{def.ratio}</span></div>
            <div className={styles.sitePreview} style={{aspectRatio:def.aspect}}>
              <img id={`preview-${def.slot}`} src={item.asset.url} alt={item.altText??def.title} style={{objectPosition:`${crop.positionX}% ${crop.positionY}%`,transform:`scale(${crop.zoom/100})`,transformOrigin:`${crop.positionX}% ${crop.positionY}%`}}/>
            </div>
            <button className={styles.largePreviewButton} type="button" onClick={()=>setPreviewSlot(def.slot)}>پیش‌نمایش بزرگ خروجی سایت</button>
          </div>
        </div>:<div className={styles.emptySlot}>هنوز تصویری برای این بخش انتخاب نشده است.</div>}

        <div className={styles.slotBody}>
          <label>Alt Text<input defaultValue={item?.altText??''} id={`alt-${def.slot}`} placeholder="توضیح دقیق تصویر برای دسترسی و SEO"/></label>
          {item?.asset&&<div className={styles.cropBox}><div className={styles.cropHead}><b>تنظیم Crop خروجی سایت</b><span id={`crop-values-${def.slot}`}>X {crop.positionX}% · Y {crop.positionY}% · Zoom {crop.zoom}%</span></div>
            <label>حرکت افقی<input id={`crop-x-${def.slot}`} type="range" min="0" max="100" defaultValue={crop.positionX} onInput={()=>refreshPreview(def.slot)}/></label>
            <label>حرکت عمودی<input id={`crop-y-${def.slot}`} type="range" min="0" max="100" defaultValue={crop.positionY} onInput={()=>refreshPreview(def.slot)}/></label>
            <label>زوم<input id={`crop-z-${def.slot}`} type="range" min="100" max="200" defaultValue={crop.zoom} onInput={()=>refreshPreview(def.slot)}/></label>
          </div>}
          <div className={styles.actions}><button className={styles.primary} type="button" disabled={busy===def.slot} onClick={()=>choose(def.slot)}>{busy===def.slot?'در حال انجام...':item?.asset?'جایگزینی عکس':'آپلود عکس'}</button>{item?.asset&&<><button type="button" disabled={busy===def.slot} onClick={()=>{const input=document.getElementById(`alt-${def.slot}`) as HTMLInputElement|null;void updateSlot(def.slot,item.asset!.id,input?.value??'',readCrop(def.slot));}}>ذخیره متن و کادر</button><button className={styles.danger} type="button" disabled={busy===def.slot} onClick={()=>void updateSlot(def.slot,null,'',{positionX:50,positionY:50,zoom:100})}>حذف از بخش</button></>}</div>
        </div>
      </article>;})}</div>
    </>:<>
      <div className={styles.libraryHead}><div><h2>Media Library</h2><p>آرشیو فایل‌های آپلودشده EVA. تصویری که در محصول یا یکی از جایگاه‌های سایت استفاده می‌شود تا زمان آزاد شدن قابل حذف نیست.</p></div><span>{data.assets.length} فایل</span></div>
      {data.assets.length?<div className={styles.libraryGrid}>{data.assets.map(asset=><article className={styles.asset} key={asset.id}><img src={asset.url} alt={asset.originalName}/><div><strong title={asset.originalName}>{asset.originalName}</strong><small>{(asset.sizeBytes/1024/1024).toFixed(2)} MB</small><button type="button" disabled={busy===asset.id} onClick={()=>void removeAsset(asset)}>حذف فایل</button></div></article>)}</div>:<div className={styles.empty}>هنوز تصویری در کتابخانه آپلود نشده است.</div>}
    </>}

    {modalDef&&modalItem?.asset&&<div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={`پیش‌نمایش ${modalDef.title}`} onMouseDown={event=>{if(event.currentTarget===event.target)setPreviewSlot(null);}}>
      <div className={styles.modal}>
        <div className={styles.modalHead}><div><b>{modalDef.title}</b><span>این کادر همان نسبت خروجی سایت را نشان می‌دهد — {modalDef.ratio}</span></div><button type="button" onClick={()=>setPreviewSlot(null)}>بستن ×</button></div>
        <div className={styles.modalCanvas}>
          <div className={styles.modalFrame} style={{aspectRatio:modalDef.aspect,maxWidth:modalDef.ratio==='2:1'?'1100px':'min(620px, 56vh)'}}>
            <img id={`modal-preview-${modalDef.slot}`} src={modalItem.asset.url} alt={modalItem.altText??modalDef.title} style={{objectPosition:`${modalCrop.positionX}% ${modalCrop.positionY}%`,transform:`scale(${modalCrop.zoom/100})`,transformOrigin:`${modalCrop.positionX}% ${modalCrop.positionY}%`}}/>
          </div>
        </div>
        <div className={styles.modalControls}>
          <div className={styles.cropHead}><b>تنظیم Crop روی پیش‌نمایش بزرگ</b><span id={`modal-crop-values-${modalDef.slot}`}>X {modalCrop.positionX}% · Y {modalCrop.positionY}% · Zoom {modalCrop.zoom}%</span></div>
          <label>حرکت افقی<input type="range" min="0" max="100" defaultValue={modalCrop.positionX} onInput={event=>setCropValue(modalDef.slot,'x',Number(event.currentTarget.value))}/></label>
          <label>حرکت عمودی<input type="range" min="0" max="100" defaultValue={modalCrop.positionY} onInput={event=>setCropValue(modalDef.slot,'y',Number(event.currentTarget.value))}/></label>
          <label>زوم<input type="range" min="100" max="200" defaultValue={modalCrop.zoom} onInput={event=>setCropValue(modalDef.slot,'z',Number(event.currentTarget.value))}/></label>
        </div>
        <div className={styles.modalHint}>بعد از رسیدن به کادر دلخواه، پنجره را ببند و «ذخیره متن و کادر» را بزن.</div>
      </div>
    </div>}
  </section>;
}
