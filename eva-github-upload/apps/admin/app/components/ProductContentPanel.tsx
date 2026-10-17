'use client';

import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProductContentPanel.module.css';

type Product = { id:string; nameFa:string; masterSku:string };
type ImageItem = { id?:string; url:string; altText:string; role:'MAIN'|'GALLERY'|'ON_BODY'|'DETAIL'; sortOrder:number };
type UploadedAsset = { id:string; url:string; originalName:string; mimeType:string; sizeBytes:number };
type ProductContent = {id:string;nameFa:string;masterSku:string;shortDescription:string|null;story:string|null;goldColor:string|null;styleLabel:string|null;details:string|null;dimensions:string|null;sizeGuide:string|null;careInstructions:string|null;packagingNote:string|null;seoTitle:string|null;seoDescription:string|null;images:ImageItem[]};
type ProductContentPanelProps={
  products:Product[];
  initialProductId?:string;
  hideSelector?:boolean;
  onSaved?:()=>void;
  onBack?:()=>void;
  saveLabel?:string;
  backLabel?:string;
};

const blankImage=(sortOrder:number):ImageItem=>({url:'',altText:'',role:sortOrder===0?'MAIN':'GALLERY',sortOrder});
function RequiredLabel({children}:{children:ReactNode}){return <span className={styles.requiredLabel}>{children}<b aria-hidden="true">*</b></span>;}

export default function ProductContentPanel({products,initialProductId,hideSelector=false,onSaved,onBack,saveLabel='ذخیره تغییرات',backLabel='مرحله قبل'}:ProductContentPanelProps){
  const router=useRouter();
  const fileInput=useRef<HTMLInputElement|null>(null);
  const dragIndex=useRef<number|null>(null);
  const [productId,setProductId]=useState(initialProductId ?? products[0]?.id ?? '');
  const [data,setData]=useState<ProductContent|null>(null);
  const [images,setImages]=useState<ImageItem[]>([blankImage(0),blankImage(1),blankImage(2),blankImage(3)]);
  const [loading,setLoading]=useState(false);const [saving,setSaving]=useState(false);const [uploading,setUploading]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');

  useEffect(()=>{if(initialProductId)setProductId(initialProductId);},[initialProductId]);
  useEffect(()=>{const selectProduct=(event:Event)=>{const custom=event as CustomEvent<{productId?:string}>;const next=custom.detail?.productId;if(next&&products.some(product=>product.id===next))setProductId(next);};window.addEventListener('eva-admin-select-product',selectProduct);return()=>window.removeEventListener('eva-admin-select-product',selectProduct);},[products]);
  useEffect(()=>{if(!productId){setData(null);return;}let cancelled=false;async function load(){setLoading(true);setMessage('');setError('');try{const response=await fetch('/api/admin/products/'+productId+'/content',{cache:'no-store'});if(!response.ok)throw new Error(await response.text());const payload:ProductContent=await response.json();if(cancelled)return;setData(payload);const existing=payload.images??[];const next=[...existing];while(next.length<4)next.push(blankImage(next.length));setImages(next.slice(0,12).map((item,index)=>({...item,sortOrder:item.sortOrder??index})));}catch(cause){if(!cancelled)setError(cause instanceof Error?cause.message:'دریافت اطلاعات محصول انجام نشد.');}finally{if(!cancelled)setLoading(false);}}void load();return()=>{cancelled=true;};},[productId]);

  function normalize(items:ImageItem[]){return items.slice(0,12).map((item,index)=>({...item,sortOrder:index}));}
  function updateImage(index:number,field:keyof ImageItem,value:string|number){setImages(current=>current.map((item,i)=>i===index?({...item,[field]:value} as ImageItem):item));}
  function addImage(){if(images.length<12)setImages(current=>normalize([...current,blankImage(current.length)]));}
  function removeImage(index:number){setImages(current=>{const next=current.filter((_,i)=>i!==index);while(next.length<4)next.push(blankImage(next.length));return normalize(next);});}
  function makeMain(index:number){setImages(current=>normalize(current.map((item,i)=>({...item,role:i===index?'MAIN':item.role==='MAIN'?'GALLERY':item.role}))));}
  function moveImage(from:number,to:number){if(from===to||from<0||to<0)return;setImages(current=>{const next=[...current];const [item]=next.splice(from,1);next.splice(to,0,item);return normalize(next);});}

  async function uploadOne(file:File):Promise<UploadedAsset>{
    const form=new FormData();form.append('file',file);
    const response=await fetch('/api/admin/media/upload',{method:'POST',body:form});
    const raw=await response.text();
    if(!response.ok)throw new Error(raw||`آپلود ${file.name} انجام نشد.`);
    return JSON.parse(raw) as UploadedAsset;
  }

  async function uploadFiles(files:File[]){
    if(!files.length||uploading)return;
    const remaining=12-images.filter(item=>item.url.trim()).length;
    const selected=files.slice(0,remaining);
    if(!selected.length){setError('حداکثر ۱۲ تصویر برای هر محصول قابل ثبت است.');return;}
    setUploading(true);setMessage('');setError('');
    try{
      const uploaded=await Promise.all(selected.map(uploadOne));
      setImages(current=>{
        const filled=current.filter(item=>item.url.trim());
        let hasMain=filled.some(item=>item.role==='MAIN');
        for(const asset of uploaded){
          filled.push({url:asset.url,altText:'',role:hasMain?'GALLERY':'MAIN',sortOrder:filled.length});
          hasMain=true;
        }
        while(filled.length<4)filled.push(blankImage(filled.length));
        return normalize(filled);
      });
      setMessage(`${uploaded.length} تصویر با موفقیت آپلود شد. Alt Text را تکمیل و تغییرات را ذخیره کن.`);
    }catch(cause){setError(cause instanceof Error?cause.message:'آپلود تصویر انجام نشد.');}
    finally{setUploading(false);if(fileInput.current)fileInput.current.value='';}
  }

  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!productId||saving||uploading)return;setSaving(true);setMessage('');setError('');const form=new FormData(event.currentTarget);const payload={shortDescription:form.get('shortDescription'),story:form.get('story'),goldColor:form.get('goldColor'),styleLabel:form.get('styleLabel'),details:form.get('details'),dimensions:form.get('dimensions'),sizeGuide:form.get('sizeGuide'),careInstructions:form.get('careInstructions'),packagingNote:form.get('packagingNote'),seoTitle:form.get('seoTitle'),seoDescription:form.get('seoDescription'),images:images.filter(image=>image.url.trim()).map((image,index)=>({url:image.url.trim(),altText:image.altText.trim(),role:image.role,sortOrder:index}))};try{const response=await fetch('/api/admin/products/'+productId+'/content',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const raw=await response.text();if(!response.ok)throw new Error(raw||'ذخیره انجام نشد.');const updated:ProductContent=JSON.parse(raw);setData(updated);const next=[...(updated.images??[])];while(next.length<4)next.push(blankImage(next.length));setImages(normalize(next));setMessage('محتوا و تصاویر محصول ذخیره شد.');window.dispatchEvent(new Event('eva-admin-catalog-change'));onSaved?.();router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'ذخیره انجام نشد.');}finally{setSaving(false);}}

  return <section id="product-content" className={styles.panel}>
    <div className={styles.head}><div><h3>محتوا و تصاویر</h3><p>متن، تصاویر و اطلاعات SEO محصول را در یک‌جا مدیریت کن.</p></div>{!hideSelector&&<select value={productId} onChange={event=>setProductId(event.target.value)} aria-label="انتخاب محصول">{products.map(product=><option key={product.id} value={product.id}>{product.nameFa} — {product.masterSku}</option>)}</select>}</div>
    {loading&&<div className={styles.notice}>در حال دریافت محتوای محصول...</div>}{message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}
    {data&&!loading&&<form onSubmit={submit} className={styles.form}>
      <div className={styles.identity}><div><strong>{data.nameFa}</strong><span dir="ltr">{data.masterSku}</span></div><div className={styles.requiredNote}><b>*</b><span>الزامی برای انتشار</span></div></div>

      <section className={styles.section}><div className={styles.sectionHead}><strong>محتوای اصلی</strong></div>
        <div className={styles.grid2}><label><RequiredLabel>رنگ طلا</RequiredLabel><input name="goldColor" defaultValue={data.goldColor??''} placeholder="مثلاً زرد" /></label><label><RequiredLabel>استایل</RequiredLabel><input name="styleLabel" defaultValue={data.styleLabel??''} placeholder="مثلاً مینیمال / روزمره" /></label></div>
        <label><RequiredLabel>توضیح کوتاه</RequiredLabel><textarea name="shortDescription" defaultValue={data.shortDescription??''} rows={2} placeholder="یک توضیح کوتاه کنار عنوان محصول" /></label>
        <label><RequiredLabel>داستان محصول</RequiredLabel><textarea name="story" defaultValue={data.story??''} rows={4} placeholder="داستان و کانسپت طراحی محصول" /></label>
        <label>جزئیات محصول<textarea name="details" defaultValue={data.details??''} rows={3} placeholder="جزئیات ساخت، فرم، قفل، زنجیر یا هر نکته مهم" /></label>
        <div className={styles.grid2}><label>ابعاد / طول<textarea name="dimensions" defaultValue={data.dimensions??''} rows={2} /></label><label>راهنمای سایز<textarea name="sizeGuide" defaultValue={data.sizeGuide??''} rows={2} /></label></div>
        <div className={styles.grid2}><label>مراقبت<textarea name="careInstructions" defaultValue={data.careInstructions??''} rows={2} /></label><label>بسته‌بندی<textarea name="packagingNote" defaultValue={data.packagingNote??''} rows={2} /></label></div>
      </section>

      <section className={`${styles.section} ${styles.mediaSection}`} onDragOver={event=>event.preventDefault()} onDrop={event=>{if(event.dataTransfer.files?.length){event.preventDefault();void uploadFiles(Array.from(event.dataTransfer.files));}}}>
        <div className={styles.mediaHead}><div><strong>تصاویر</strong><span>فایل را بکش و اینجا رها کن یا از کامپیوتر انتخاب کن. JPG/PNG/WebP/AVIF تا ۱۰MB.</span></div><div className={styles.mediaActions}><input ref={fileInput} className={styles.fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={event=>void uploadFiles(Array.from(event.target.files??[]))}/><button type="button" onClick={()=>fileInput.current?.click()} disabled={uploading}>{uploading?'در حال آپلود...':'↑ آپلود عکس'}</button><button type="button" onClick={addImage} disabled={images.length>=12}>+ URL</button></div></div>
        <div className={styles.dropHint}>تصاویر را می‌توانی برای تغییر ترتیب بکشـی. ستاره، تصویر اصلی محصول را مشخص می‌کند.</div>
        <div className={styles.imageList}>{images.map((image,index)=>{const isMain=image.role==='MAIN';return <div className={`${styles.imageRow} ${isMain?styles.mainImageRow:''}`} key={`${image.id??image.url}-${index}`} draggable={Boolean(image.url)} onDragStart={()=>{dragIndex.current=index;}} onDragOver={event=>event.preventDefault()} onDrop={event=>{if(event.dataTransfer.files?.length)return;event.preventDefault();if(dragIndex.current!==null)moveImage(dragIndex.current,index);dragIndex.current=null;}}>
          <div className={styles.preview}>{image.url?<img src={image.url} alt="پیش‌نمایش" />:<span>{index+1}</span>}</div>
          <label>{isMain?<RequiredLabel>URL تصویر اصلی</RequiredLabel>:'URL'}<input value={image.url} onChange={event=>updateImage(index,'url',event.target.value)} dir="ltr" placeholder="https://..." /></label>
          <label>{isMain?<RequiredLabel>Alt Text تصویر اصلی</RequiredLabel>:'Alt Text'}<input value={image.altText} onChange={event=>updateImage(index,'altText',event.target.value)} placeholder="مثلاً گردنبند طلای EVA نمای روبرو" /></label>
          <label>نقش<select value={image.role} onChange={event=>{const role=event.target.value as ImageItem['role'];if(role==='MAIN')makeMain(index);else updateImage(index,'role',role);}}><option value="MAIN">تصویر اصلی</option><option value="GALLERY">گالری</option><option value="ON_BODY">روی بدن</option><option value="DETAIL">جزئیات</option></select></label>
          <div className={styles.rowActions}><button type="button" className={styles.mainButton} onClick={()=>makeMain(index)} disabled={!image.url||isMain} title="انتخاب به عنوان تصویر اصلی">★</button><button type="button" className={styles.remove} onClick={()=>removeImage(index)}>حذف</button></div>
        </div>;})}</div>
      </section>

      <section className={styles.section}><div className={styles.sectionHead}><strong>SEO</strong></div><div className={`${styles.grid2} ${styles.seoGrid}`}><label><RequiredLabel>SEO Title</RequiredLabel><input name="seoTitle" defaultValue={data.seoTitle??''} maxLength={120} /></label><label><RequiredLabel>SEO Description</RequiredLabel><textarea name="seoDescription" defaultValue={data.seoDescription??''} rows={2} maxLength={320} /></label></div></section>
      <div className={styles.actions}>{onBack&&<button type="button" className={styles.back} disabled={saving} onClick={onBack}>{backLabel}</button>}<button className={styles.save} disabled={saving||uploading}>{saving?'در حال ذخیره...':saveLabel}</button></div>
    </form>}
  </section>;
}
