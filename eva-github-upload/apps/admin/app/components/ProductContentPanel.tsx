'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './ProductContentPanel.module.css';

type Product = { id:string; nameFa:string; masterSku:string };
type ImageItem = { id?:string; url:string; altText:string; role:'MAIN'|'GALLERY'|'ON_BODY'|'DETAIL'; sortOrder:number };
type ProductContent = {
  id:string;
  nameFa:string;
  masterSku:string;
  shortDescription:string|null;
  story:string|null;
  goldColor:string|null;
  styleLabel:string|null;
  details:string|null;
  dimensions:string|null;
  sizeGuide:string|null;
  careInstructions:string|null;
  packagingNote:string|null;
  seoTitle:string|null;
  seoDescription:string|null;
  images:ImageItem[];
};

const blankImage=(sortOrder:number):ImageItem=>({url:'',altText:'',role:sortOrder===0?'MAIN':'GALLERY',sortOrder});

export default function ProductContentPanel({products}:{products:Product[]}){
  const [productId,setProductId]=useState(products[0]?.id ?? '');
  const [data,setData]=useState<ProductContent|null>(null);
  const [images,setImages]=useState<ImageItem[]>([blankImage(0),blankImage(1),blankImage(2),blankImage(3)]);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    if(!productId){setData(null);return;}
    let cancelled=false;
    async function load(){
      setLoading(true);setMessage('');setError('');
      try{
        const response=await fetch('/api/admin/products/'+productId+'/content',{cache:'no-store'});
        if(!response.ok)throw new Error(await response.text());
        const payload:ProductContent=await response.json();
        if(cancelled)return;
        setData(payload);
        const existing=payload.images ?? [];
        const next=[...existing];
        while(next.length<4)next.push(blankImage(next.length));
        setImages(next.slice(0,12).map((item,index)=>({...item,sortOrder:item.sortOrder ?? index})));
      }catch(cause){
        if(!cancelled)setError(cause instanceof Error?cause.message:'دریافت اطلاعات محصول انجام نشد.');
      }finally{if(!cancelled)setLoading(false);}
    }
    void load();
    return()=>{cancelled=true;};
  },[productId]);

  function updateImage(index:number,field:keyof ImageItem,value:string|number){
    setImages(current=>current.map((item,i)=>i===index?({...item,[field]:value} as ImageItem):item));
  }

  function addImage(){
    if(images.length>=12)return;
    setImages(current=>[...current,blankImage(current.length)]);
  }

  function removeImage(index:number){
    setImages(current=>current.filter((_,i)=>i!==index).map((item,i)=>({...item,sortOrder:i})));
  }

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!productId||saving)return;
    setSaving(true);setMessage('');setError('');
    const form=new FormData(event.currentTarget);
    const payload={
      shortDescription:form.get('shortDescription'),
      story:form.get('story'),
      goldColor:form.get('goldColor'),
      styleLabel:form.get('styleLabel'),
      details:form.get('details'),
      dimensions:form.get('dimensions'),
      sizeGuide:form.get('sizeGuide'),
      careInstructions:form.get('careInstructions'),
      packagingNote:form.get('packagingNote'),
      seoTitle:form.get('seoTitle'),
      seoDescription:form.get('seoDescription'),
      images:images.filter(image=>image.url.trim()).map((image,index)=>({
        url:image.url.trim(),altText:image.altText.trim(),role:image.role,sortOrder:index,
      })),
    };
    try{
      const response=await fetch('/api/admin/products/'+productId+'/content',{
        method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload),
      });
      const raw=await response.text();
      if(!response.ok)throw new Error(raw||'ذخیره انجام نشد.');
      const updated:ProductContent=JSON.parse(raw);
      setData(updated);
      const next=[...(updated.images??[])];
      while(next.length<4)next.push(blankImage(next.length));
      setImages(next);
      setMessage('محتوا و تصاویر محصول ذخیره شد.');
    }catch(cause){setError(cause instanceof Error?cause.message:'ذخیره انجام نشد.');}
    finally{setSaving(false);}
  }

  return <section id="product-content" className={styles.panel}>
    <div className={styles.head}>
      <div><span>PRODUCT CONTENT & MEDIA</span><h3>محتوا و تصاویر محصول</h3></div>
      <select value={productId} onChange={event=>setProductId(event.target.value)} aria-label="انتخاب محصول">
        {products.map(product=><option key={product.id} value={product.id}>{product.nameFa} — {product.masterSku}</option>)}
      </select>
    </div>

    {loading&&<div className={styles.notice}>در حال دریافت محتوای محصول...</div>}
    {message&&<div className={styles.success}>{message}</div>}
    {error&&<div className={styles.error}>{error}</div>}

    {data&&!loading&&<form onSubmit={submit} className={styles.form}>
      <div className={styles.identity}><strong>{data.nameFa}</strong><span dir="ltr">{data.masterSku}</span></div>
      <div className={styles.grid2}><label>رنگ طلا<input name="goldColor" defaultValue={data.goldColor??''} placeholder="مثلاً زرد" /></label><label>استایل<input name="styleLabel" defaultValue={data.styleLabel??''} placeholder="مثلاً مینیمال / روزمره" /></label></div>
      <label>توضیح کوتاه<textarea name="shortDescription" defaultValue={data.shortDescription??''} rows={2} placeholder="یک توضیح کوتاه کنار عنوان محصول" /></label>
      <label>داستان محصول<textarea name="story" defaultValue={data.story??''} rows={5} placeholder="داستان و کانسپت طراحی محصول" /></label>
      <label>جزئیات محصول<textarea name="details" defaultValue={data.details??''} rows={4} placeholder="جزئیات ساخت، فرم، قفل، زنجیر یا هر نکته مهم" /></label>
      <div className={styles.grid2}><label>ابعاد / طول<textarea name="dimensions" defaultValue={data.dimensions??''} rows={3} placeholder="مثلاً طول زنجیر ۴۲ سانتی‌متر" /></label><label>راهنمای سایز<textarea name="sizeGuide" defaultValue={data.sizeGuide??''} rows={3} placeholder="راهنمای انتخاب سایز یا طول" /></label></div>
      <div className={styles.grid2}><label>مراقبت<textarea name="careInstructions" defaultValue={data.careInstructions??''} rows={3} placeholder="روش نگهداری و مراقبت" /></label><label>بسته‌بندی<textarea name="packagingNote" defaultValue={data.packagingNote??''} rows={3} placeholder="توضیح بسته‌بندی این محصول" /></label></div>

      <div className={styles.mediaBlock}>
        <div className={styles.mediaHead}><div><strong>تصاویر محصول</strong><span>فعلاً URL؛ آپلود فایل در مرحله اتصال Storage اضافه می‌شود.</span></div><button type="button" onClick={addImage} disabled={images.length>=12}>+ تصویر</button></div>
        <div className={styles.imageList}>{images.map((image,index)=><div className={styles.imageRow} key={index}>
          <div className={styles.preview}>{image.url?<img src={image.url} alt="پیش‌نمایش" />:<span>{index+1}</span>}</div>
          <label>URL<input value={image.url} onChange={event=>updateImage(index,'url',event.target.value)} dir="ltr" placeholder="https://..." /></label>
          <label>Alt Text<input value={image.altText} onChange={event=>updateImage(index,'altText',event.target.value)} placeholder="توضیح دقیق تصویر" /></label>
          <label>نقش<select value={image.role} onChange={event=>updateImage(index,'role',event.target.value)}><option value="MAIN">تصویر اصلی</option><option value="GALLERY">گالری</option><option value="ON_BODY">روی بدن</option><option value="DETAIL">جزئیات</option></select></label>
          <button type="button" className={styles.remove} onClick={()=>removeImage(index)}>حذف</button>
        </div>)}</div>
      </div>

      <div className={styles.seo}><strong>SEO</strong><label>SEO Title<input name="seoTitle" defaultValue={data.seoTitle??''} maxLength={120} /></label><label>SEO Description<textarea name="seoDescription" defaultValue={data.seoDescription??''} rows={2} maxLength={320} /></label></div>
      <button className={styles.save} disabled={saving}>{saving?'در حال ذخیره...':'ذخیره محتوا و تصاویر'}</button>
    </form>}
  </section>;
}
