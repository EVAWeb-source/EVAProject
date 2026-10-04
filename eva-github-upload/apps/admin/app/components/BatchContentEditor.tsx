'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './BatchContentEditor.module.css';

type Product={id:string;nameFa:string;masterSku:string;status:string};
type ProductContent={
  id:string;nameFa:string;masterSku:string;status:string;
  shortDescription:string|null;story:string|null;goldColor:string|null;styleLabel:string|null;
  seoTitle:string|null;seoDescription:string|null;updatedAt?:string;
};
type Field='shortDescription'|'story'|'goldColor'|'styleLabel'|'seoTitle'|'seoDescription';
type Filter='ALL'|'INCOMPLETE'|'COMPLETE';

const fields:Field[]=['shortDescription','story','goldColor','styleLabel','seoTitle','seoDescription'];
const text=(value:string|null|undefined)=>value??'';
const completeContent=(item:ProductContent)=>Boolean(item.shortDescription?.trim()&&item.story?.trim()&&item.goldColor?.trim()&&item.styleLabel?.trim());
const completeSeo=(item:ProductContent)=>Boolean(item.seoTitle?.trim()&&item.seoDescription?.trim());

async function getContent(id:string){
  const response=await fetch(`/api/admin/products/${id}/content`,{cache:'no-store'});
  const raw=await response.text();
  if(!response.ok)throw new Error(raw||`HTTP ${response.status}`);
  return JSON.parse(raw) as ProductContent;
}

async function patchContent(id:string,item:ProductContent){
  const payload=Object.fromEntries(fields.map(field=>[field,item[field]??'']));
  const response=await fetch(`/api/admin/products/${id}/content`,{
    method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload),
  });
  const raw=await response.text();
  if(!response.ok){
    try{const parsed=JSON.parse(raw);throw new Error(Array.isArray(parsed.message)?parsed.message.join('، '):(parsed.message||parsed.error||raw));}
    catch(error){if(error instanceof Error&&error.message!=='Unexpected end of JSON input')throw error;throw new Error(raw||`HTTP ${response.status}`);}
  }
  return JSON.parse(raw) as ProductContent;
}

export default function BatchContentEditor({products}:{products:Product[]}){
  const [items,setItems]=useState<Record<string,ProductContent>>({});
  const [loading,setLoading]=useState(true);
  const [dirty,setDirty]=useState<Set<string>>(new Set());
  const [saving,setSaving]=useState<Set<string>>(new Set());
  const [expanded,setExpanded]=useState<string>('');
  const [filter,setFilter]=useState<Filter>('ALL');
  const [query,setQuery]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      setLoading(true);setError('');
      const settled=await Promise.allSettled(products.map(product=>getContent(product.id)));
      if(cancelled)return;
      const next:Record<string,ProductContent>={};
      let failed=0;
      settled.forEach((result,index)=>{
        if(result.status==='fulfilled')next[products[index].id]=result.value;
        else failed+=1;
      });
      setItems(next);
      if(failed)setError(`اطلاعات ${new Intl.NumberFormat('fa-IR').format(failed)} محصول دریافت نشد. صفحه را Refresh کن.`);
      setExpanded(products.find(product=>next[product.id]&&!completeContent(next[product.id]))?.id??products[0]?.id??'');
      setLoading(false);
    }
    void load();
    return()=>{cancelled=true;};
  },[products]);

  function change(id:string,field:Field,value:string){
    setItems(current=>({...current,[id]:{...current[id],[field]:value}}));
    setDirty(current=>{const next=new Set(current);next.add(id);return next;});
    setMessage('');setError('');
  }

  async function saveOne(id:string,quiet=false){
    const item=items[id];
    if(!item)return false;
    setSaving(current=>new Set(current).add(id));
    try{
      const updated=await patchContent(id,item);
      setItems(current=>({...current,[id]:updated}));
      setDirty(current=>{const next=new Set(current);next.delete(id);return next;});
      if(!quiet)setMessage(`محتوای «${item.nameFa}» ذخیره شد.`);
      return true;
    }catch(cause){
      if(!quiet)setError(cause instanceof Error?cause.message:'ذخیره انجام نشد.');
      return false;
    }finally{
      setSaving(current=>{const next=new Set(current);next.delete(id);return next;});
    }
  }

  async function saveAll(){
    const ids=[...dirty];
    if(!ids.length)return;
    setMessage('');setError('');
    let success=0;let failed=0;
    for(const id of ids){
      const ok=await saveOne(id,true);
      if(ok)success+=1;else failed+=1;
    }
    if(success)setMessage(`${new Intl.NumberFormat('fa-IR').format(success)} محصول ذخیره شد.`);
    if(failed)setError(`ذخیره ${new Intl.NumberFormat('fa-IR').format(failed)} محصول ناموفق بود؛ تغییرات ناموفق همچنان علامت‌گذاری شده‌اند.`);
  }

  const stats=useMemo(()=>{
    const loaded=products.map(product=>items[product.id]).filter((item):item is ProductContent=>Boolean(item));
    return {
      total:products.length,
      content:loaded.filter(completeContent).length,
      seo:loaded.filter(completeSeo).length,
      complete:loaded.filter(item=>completeContent(item)&&completeSeo(item)).length,
    };
  },[items,products]);

  const visible=useMemo(()=>products.filter(product=>{
    const item=items[product.id];
    if(!item)return false;
    const q=query.trim().toLowerCase();
    if(q&&!`${product.nameFa} ${product.masterSku}`.toLowerCase().includes(q))return false;
    const isComplete=completeContent(item)&&completeSeo(item);
    if(filter==='INCOMPLETE'&&isComplete)return false;
    if(filter==='COMPLETE'&&!isComplete)return false;
    return true;
  }),[products,items,query,filter]);

  function nextIncomplete(currentId:string){
    const index=products.findIndex(product=>product.id===currentId);
    const ordered=[...products.slice(index+1),...products.slice(0,index+1)];
    const next=ordered.find(product=>items[product.id]&&!(completeContent(items[product.id])&&completeSeo(items[product.id])));
    if(next)setExpanded(next.id);
  }

  return <section className={styles.wrapper}>
    <div className={styles.summary}>
      <article><span>محصولات آغاز</span><strong>{stats.total.toLocaleString('fa-IR')}</strong></article>
      <article><span>Content کامل</span><strong>{stats.content.toLocaleString('fa-IR')}</strong></article>
      <article><span>SEO کامل</span><strong>{stats.seo.toLocaleString('fa-IR')}</strong></article>
      <article className={styles.ready}><span>هر دو کامل</span><strong>{stats.complete.toLocaleString('fa-IR')} / {stats.total.toLocaleString('fa-IR')}</strong></article>
    </div>

    <div className={styles.toolbar}>
      <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="جستجو نام یا SKU..." />
      <div className={styles.filters}>
        <button className={filter==='ALL'?styles.active:''} onClick={()=>setFilter('ALL')}>همه</button>
        <button className={filter==='INCOMPLETE'?styles.active:''} onClick={()=>setFilter('INCOMPLETE')}>ناقص</button>
        <button className={filter==='COMPLETE'?styles.active:''} onClick={()=>setFilter('COMPLETE')}>کامل</button>
      </div>
      <button className={styles.saveAll} disabled={!dirty.size||saving.size>0} onClick={saveAll}>ذخیره همه تغییرات {dirty.size?`(${dirty.size.toLocaleString('fa-IR')})`:''}</button>
    </div>

    {message&&<div className={styles.success}>{message}</div>}
    {error&&<div className={styles.error}>{error}</div>}
    {loading&&<div className={styles.notice}>در حال دریافت محتوای محصولات آغاز...</div>}

    {!loading&&<div className={styles.list}>
      {visible.map(product=>{
        const item=items[product.id];
        const contentDone=completeContent(item);
        const seoDone=completeSeo(item);
        const open=expanded===product.id;
        const isDirty=dirty.has(product.id);
        const isSaving=saving.has(product.id);
        return <article key={product.id} className={`${styles.row} ${open?styles.rowOpen:''}`}>
          <button className={styles.rowHead} onClick={()=>setExpanded(open?'':product.id)}>
            <div className={styles.identity}><strong>{product.nameFa}</strong><span dir="ltr">{product.masterSku}</span></div>
            <div className={styles.gates}><span className={contentDone?styles.done:styles.todo}>{contentDone?'✓':'○'} Content</span><span className={seoDone?styles.done:styles.todo}>{seoDone?'✓':'○'} SEO</span>{isDirty&&<span className={styles.unsaved}>ذخیره‌نشده</span>}</div>
            <span className={styles.chevron}>{open?'−':'+'}</span>
          </button>

          {open&&<div className={styles.editor}>
            <div className={styles.grid2}>
              <label>رنگ طلا<input value={text(item.goldColor)} onChange={event=>change(product.id,'goldColor',event.target.value)} placeholder="مثلاً زرد" /></label>
              <label>استایل<input value={text(item.styleLabel)} onChange={event=>change(product.id,'styleLabel',event.target.value)} placeholder="مثلاً مینیمال / روزمره" /></label>
            </div>
            <label>توضیح کوتاه<textarea rows={2} value={text(item.shortDescription)} onChange={event=>change(product.id,'shortDescription',event.target.value)} placeholder="توضیح کوتاه کنار عنوان محصول" /></label>
            <label>Story<textarea rows={4} value={text(item.story)} onChange={event=>change(product.id,'story',event.target.value)} placeholder="داستان و کانسپت محصول" /></label>
            <div className={styles.seoBlock}>
              <strong>SEO</strong>
              <label>SEO Title <small>{text(item.seoTitle).length}/120</small><input maxLength={120} value={text(item.seoTitle)} onChange={event=>change(product.id,'seoTitle',event.target.value)} /></label>
              <label>SEO Description <small>{text(item.seoDescription).length}/320</small><textarea rows={2} maxLength={320} value={text(item.seoDescription)} onChange={event=>change(product.id,'seoDescription',event.target.value)} /></label>
            </div>
            <div className={styles.actions}>
              <button className={styles.primary} disabled={!isDirty||isSaving} onClick={()=>void saveOne(product.id)}>{isSaving?'در حال ذخیره...':'ذخیره این محصول'}</button>
              <button onClick={()=>nextIncomplete(product.id)}>محصول ناقص بعدی</button>
              <a href={`/catalog/products/${product.id}`}>ویرایش کامل محصول ↗</a>
            </div>
          </div>}
        </article>;
      })}
      {!visible.length&&<div className={styles.notice}>محصولی با این فیلتر پیدا نشد.</div>}
    </div>}
  </section>;
}
