'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './HomeContentManager.module.css';

type HomeContent={
  heroEyebrow:string;
  heroTitle:string;
  heroBody:string;
  heroCtaLabel:string;
  heroCtaHref:string;
  storyEyebrow:string;
  storyTitle:string;
  storyBody:string;
  storyCtaLabel:string;
  storyCtaHref:string;
};

export default function HomeContentManager(){
  const [data,setData]=useState<HomeContent|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{let cancelled=false;async function load(){try{const response=await fetch('/api/admin/media/home-content',{cache:'no-store'});const raw=await response.text();if(!response.ok)throw new Error(raw||'دریافت محتوای صفحه اصلی انجام نشد.');if(!cancelled)setData(JSON.parse(raw));}catch(cause){if(!cancelled)setError(cause instanceof Error?cause.message:'دریافت محتوا انجام نشد.');}finally{if(!cancelled)setLoading(false);}}void load();return()=>{cancelled=true;};},[]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!data||saving)return;setSaving(true);setMessage('');setError('');
    const form=new FormData(event.currentTarget);
    const payload=Object.fromEntries(form.entries());
    try{const response=await fetch('/api/admin/media/home-content',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const raw=await response.text();if(!response.ok)throw new Error(raw||'ذخیره محتوا انجام نشد.');setData(JSON.parse(raw));setMessage('محتوای صفحه اصلی ذخیره شد.');}catch(cause){setError(cause instanceof Error?cause.message:'ذخیره محتوا انجام نشد.');}finally{setSaving(false);}
  }

  if(loading)return <section className={styles.panel}><div className={styles.notice}>در حال دریافت متن‌های صفحه اصلی...</div></section>;
  if(!data)return <section className={styles.panel}>{error&&<div className={styles.error}>{error}</div>}</section>;

  return <section className={styles.panel}>
    <div className={styles.head}><div><span>HOME CONTENT</span><h2>محتوای صفحه اصلی</h2><p>متن‌های اصلی Hero و بخش داستان را بدون تغییر کد مدیریت کن.</p></div></div>
    {message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}
    <form onSubmit={submit} className={styles.form}>
      <div className={styles.group}><div className={styles.groupTitle}><strong>Hero صفحه اصلی</strong><small>متن بالای صفحه، تیتر، توضیح و دکمه اصلی</small></div>
        <div className={styles.grid2}><label>عبارت بالای Hero<input name="heroEyebrow" defaultValue={data.heroEyebrow}/></label><label>متن دکمه<input name="heroCtaLabel" defaultValue={data.heroCtaLabel}/></label></div>
        <label>تیتر اصلی<input name="heroTitle" defaultValue={data.heroTitle}/></label>
        <label>متن زیر تیتر<textarea name="heroBody" defaultValue={data.heroBody} rows={3}/></label>
        <label>لینک دکمه<input name="heroCtaHref" defaultValue={data.heroCtaHref} dir="ltr" placeholder="/collections/aghaz"/></label>
      </div>
      <div className={styles.group}><div className={styles.groupTitle}><strong>داستان EVA</strong><small>متن بخش داستان صفحه اصلی</small></div>
        <div className={styles.grid2}><label>عبارت بالای عنوان<input name="storyEyebrow" defaultValue={data.storyEyebrow}/></label><label>متن دکمه<input name="storyCtaLabel" defaultValue={data.storyCtaLabel}/></label></div>
        <label>عنوان<input name="storyTitle" defaultValue={data.storyTitle}/></label>
        <label>متن داستان<textarea name="storyBody" defaultValue={data.storyBody} rows={3}/></label>
        <label>لینک دکمه<input name="storyCtaHref" defaultValue={data.storyCtaHref} dir="ltr" placeholder="/about"/></label>
      </div>
      <div className={styles.actions}><button type="submit" disabled={saving}>{saving?'در حال ذخیره...':'ذخیره متن‌های صفحه اصلی'}</button></div>
    </form>
  </section>;
}
