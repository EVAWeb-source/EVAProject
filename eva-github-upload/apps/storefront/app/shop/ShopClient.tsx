'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './shop.module.css';

type Unit = {
  id: string;
  unitSku: string;
  exactWeightGram: string;
  currentPriceToman: string;
  status: string;
};

export type ShopProduct = {
  id: string;
  nameFa: string;
  slug: string;
  masterSku: string;
  purity: number;
  collection: { nameFa: string; slug: string } | null;
  units: Unit[];
};

const categories: Record<string,string> = {
  NEC:'گردنبند', PEN:'آویز', BRA:'دستبند', RIN:'انگشتر',
  EAR:'گوشواره', SET:'ست', ANK:'پابند', CHM:'چارم',
};

const categorySlugs: Record<string,string> = {
  NEC:'necklaces', PEN:'pendants', BRA:'bracelets', RIN:'rings',
  EAR:'earrings', SET:'sets', ANK:'anklets', CHM:'charms',
};

function categoryCode(masterSku:string){ return masterSku.split('-')[2] ?? 'OTHER'; }
function categoryLabel(masterSku:string){ return categories[categoryCode(masterSku)] ?? 'سایر'; }
function toman(value:number){ return new Intl.NumberFormat('fa-IR').format(value) + ' تومان'; }
function weight(value:number){ return new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(value) + ' گرم'; }
function normalize(value:string){ return value.trim().toLocaleLowerCase('fa').replace(/ي/g,'ی').replace(/ك/g,'ک'); }

function Visual({ code }: { code:string }) {
  const variant =
    code === 'RIN' ? styles.ring :
    code === 'BRA' ? styles.arc :
    code === 'EAR' ? styles.drop :
    code === 'SET' ? styles.double :
    styles.sun;
  return <div className={styles.visual + ' ' + variant}><span className={styles.chain}/><span className={styles.jewel}/></div>;
}

export default function ShopClient({ products }: { products:ShopProduct[] }) {
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('ALL');
  const [collection,setCollection]=useState('ALL');
  const [weightBand,setWeightBand]=useState('ALL');
  const [sort,setSort]=useState('RECOMMENDED');
  const [wishlist,setWishlist]=useState<string[]>([]);
  const searchRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    try { setWishlist(JSON.parse(window.localStorage.getItem('eva-wishlist') ?? '[]')); }
    catch { setWishlist([]); }
  },[]);

  const collections=useMemo(
    ()=>Array.from(new Set(products.map(p=>p.collection?.nameFa).filter(Boolean) as string[])),
    [products]
  );
  const categoryCodes=useMemo(()=>Array.from(new Set(products.map(p=>categoryCode(p.masterSku)))),[products]);

  const result=useMemo(()=>{
    const q=normalize(query);
    const filtered=products.filter(product=>{
      if(product.units.length===0) return false;
      const minWeight=Math.min(...product.units.map(u=>Number(u.exactWeightGram)));
      const text=normalize([product.nameFa,product.masterSku,product.collection?.nameFa,categoryLabel(product.masterSku)].filter(Boolean).join(' '));
      const matchesQuery=!q || text.includes(q);
      const matchesCategory=category==='ALL' || categoryCode(product.masterSku)===category;
      const matchesCollection=collection==='ALL' || product.collection?.nameFa===collection;
      const matchesWeight=
        weightBand==='ALL' ||
        (weightBand==='ULTRA' && minWeight<0.7) ||
        (weightBand==='LIGHT' && minWeight>=0.7 && minWeight<1) ||
        (weightBand==='REGULAR' && minWeight>=1);
      return matchesQuery && matchesCategory && matchesCollection && matchesWeight;
    });

    return [...filtered].sort((a,b)=>{
      const aPrice=Math.min(...a.units.map(u=>Number(u.currentPriceToman)));
      const bPrice=Math.min(...b.units.map(u=>Number(u.currentPriceToman)));
      const aWeight=Math.min(...a.units.map(u=>Number(u.exactWeightGram)));
      const bWeight=Math.min(...b.units.map(u=>Number(u.exactWeightGram)));
      if(sort==='PRICE_ASC') return aPrice-bPrice;
      if(sort==='PRICE_DESC') return bPrice-aPrice;
      if(sort==='WEIGHT_ASC') return aWeight-bWeight;
      if(sort==='NEWEST') return products.indexOf(a)-products.indexOf(b);
      return 0;
    });
  },[products,query,category,collection,weightBand,sort]);

  function toggleWishlist(slug:string){
    setWishlist(current=>{
      const next=current.includes(slug)?current.filter(item=>item!==slug):[...current,slug];
      window.localStorage.setItem('eva-wishlist',JSON.stringify(next));
      return next;
    });
  }

  function reset(){
    setQuery('');
    setCategory('ALL');
    setCollection('ALL');
    setWeightBand('ALL');
    setSort('RECOMMENDED');
  }

  return (
    <>
      <div className={styles.announcement}>ارسال امن • فاکتور معتبر • قیمت شفاف</div>
      <header className={styles.header}>
        <a className={styles.brand} href="/">EVA</a>
        <nav><a href="/shop">فروشگاه</a><a href="/collections">کالکشن‌ها</a><a href="/#gift">هدیه</a><a href="/#lightweight">طلای سبک</a></nav>
        <div className={styles.actions}>
          <button aria-label="جستجو" onClick={()=>searchRef.current?.focus()}>⌕</button>
          <a className={styles.iconLink} href="/wishlist" aria-label="علاقه‌مندی‌ها">♡{wishlist.length>0&&<small>{wishlist.length}</small>}</a>
          <a href="/cart" className={styles.cart}>سبد</a>
        </div>
      </header>

      <section className={styles.intro}>
        <div><span>EVA SHOP</span><h1>فروشگاه</h1><p>قطعه‌های موجود ایوا را بر اساس نوع، وزن و بودجه پیدا کن.</p></div>
        <div className={styles.count}>{new Intl.NumberFormat('fa-IR').format(result.length)} محصول</div>
      </section>

      <section className={styles.searchArea}>
        <label className={styles.searchBox}>
          <span>⌕</span>
          <input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در نام محصول، کالکشن یا SKU" />
          {query&&<button onClick={()=>setQuery('')} aria-label="پاک کردن جستجو">×</button>}
        </label>
      </section>

      <nav className={styles.categoryPages} aria-label="صفحه‌های دسته‌بندی">
        <span>دسته‌ها</span>
        {categoryCodes.map(code=><a key={code} href={'/shop/'+(categorySlugs[code]??'')}>{categories[code]??code} ←</a>)}
      </nav>

      <section className={styles.toolbar}>
        <div className={styles.chips}>
          <button className={category==='ALL'?styles.active:''} onClick={()=>setCategory('ALL')}>همه</button>
          {categoryCodes.map(code=><button key={code} className={category===code?styles.active:''} onClick={()=>setCategory(code)}>{categories[code]??code}</button>)}
        </div>
        <div className={styles.tools}>
          <select value={collection} onChange={e=>setCollection(e.target.value)} aria-label="کالکشن">
            <option value="ALL">همه کالکشن‌ها</option>
            {collections.map(name=><option key={name} value={name}>{name}</option>)}
          </select>
          <select value={weightBand} onChange={e=>setWeightBand(e.target.value)} aria-label="وزن">
            <option value="ALL">همه وزن‌ها</option>
            <option value="ULTRA">کمتر از ۰.۷ گرم</option>
            <option value="LIGHT">۰.۷ تا ۱ گرم</option>
            <option value="REGULAR">۱ گرم و بیشتر</option>
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="مرتب‌سازی">
            <option value="RECOMMENDED">پیشنهادی</option>
            <option value="NEWEST">جدیدترین</option>
            <option value="PRICE_ASC">قیمت: کم به زیاد</option>
            <option value="PRICE_DESC">قیمت: زیاد به کم</option>
            <option value="WEIGHT_ASC">وزن: سبک‌تر اول</option>
          </select>
        </div>
      </section>

      {(query||category!=='ALL'||collection!=='ALL'||weightBand!=='ALL'||sort!=='RECOMMENDED')&&
        <div className={styles.filterState}><span>{new Intl.NumberFormat('fa-IR').format(result.length)} نتیجه</span><button onClick={reset}>پاک‌کردن فیلترها</button></div>}

      {result.length>0 ? (
        <section className={styles.grid}>
          {result.map(product=>{
            const prices=product.units.map(u=>Number(u.currentPriceToman));
            const weights=product.units.map(u=>Number(u.exactWeightGram));
            const minPrice=Math.min(...prices);
            const minWeight=Math.min(...weights);
            const multiple=product.units.length>1;
            const liked=wishlist.includes(product.slug);
            return <article className={styles.card} key={product.id}>
              <div className={styles.media}>
                <button
                  className={liked ? styles.heart + ' ' + styles.heartActive : styles.heart}
                  onClick={()=>toggleWishlist(product.slug)}
                  aria-label={liked?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'}
                >{liked?'♥':'♡'}</button>
                <a href={'/products/' + product.slug} aria-label={product.nameFa}><Visual code={categoryCode(product.masterSku)} /></a>
              </div>
              <a className={styles.cardBody} href={'/products/' + product.slug}>
                <div className={styles.info}>
                  <div><h2>{product.nameFa}</h2><p>{categoryLabel(product.masterSku)}{product.collection?' • کالکشن ' + product.collection.nameFa:''}</p></div>
                  <div className={styles.meta}>
                    <span>{multiple?'از ':''}{weight(minWeight)}</span>
                    <strong>{multiple?'از ':''}{toman(minPrice)}</strong>
                  </div>
                </div>
              </a>
            </article>;
          })}
        </section>
      ) : (
        <section className={styles.emptyState}><span>NO RESULTS</span><h2>محصولی با این فیلتر پیدا نشد.</h2><p>فیلترها را تغییر بده یا دوباره همه محصولات را ببین.</p><button onClick={reset}>نمایش همه محصولات</button></section>
      )}

      <footer className={styles.footer}><a className={styles.brand} href="/">EVA</a><p>بوتیک آنلاین طلای معاصر؛ طراحی ظریف و خرید شفاف.</p></footer>
    </>
  );
}
