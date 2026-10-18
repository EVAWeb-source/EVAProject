'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ProductMediaGallery.module.css';

type ProductImage={id:string;url:string;altText:string;role:'MAIN'|'GALLERY'|'ON_BODY'|'DETAIL';sortOrder:number};

const labels:Record<ProductImage['role'],string>={MAIN:'نمای اصلی',GALLERY:'گالری',ON_BODY:'نمای روی بدن',DETAIL:'جزئیات'};
const roleOrder:Record<ProductImage['role'],number>={MAIN:0,ON_BODY:1,DETAIL:2,GALLERY:3};
function variant(url:string,width:number,quality:number){const join=url.includes('?')?'&':'?';return `${url}${join}w=${width}&q=${quality}`;}

export default function ProductMediaGallery({images,name}:{images:ProductImage[];name:string}){
  const sorted=useMemo(()=>[...images].sort((a,b)=>{
    const roleDiff=roleOrder[a.role]-roleOrder[b.role];
    return roleDiff!==0?roleDiff:a.sortOrder-b.sortOrder;
  }),[images]);
  const [activeIndex,setActiveIndex]=useState(0);
  const [lightboxOpen,setLightboxOpen]=useState(false);
  const [showDesktopThumbs,setShowDesktopThumbs]=useState(false);
  const touchStart=useRef<number|null>(null);

  useEffect(()=>{
    if(activeIndex>sorted.length-1)setActiveIndex(0);
  },[activeIndex,sorted.length]);

  useEffect(()=>{
    const media=window.matchMedia('(min-width: 621px)');
    const sync=()=>setShowDesktopThumbs(media.matches);
    sync();
    media.addEventListener?.('change',sync);
    return()=>media.removeEventListener?.('change',sync);
  },[]);

  useEffect(()=>{
    if(!lightboxOpen)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    function onKeyDown(event:KeyboardEvent){
      if(event.key==='Escape')setLightboxOpen(false);
      if(event.key==='ArrowLeft')setActiveIndex(current=>(current-1+sorted.length)%sorted.length);
      if(event.key==='ArrowRight')setActiveIndex(current=>(current+1)%sorted.length);
    }
    window.addEventListener('keydown',onKeyDown);
    return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',onKeyDown);};
  },[lightboxOpen,sorted.length]);

  function previous(){if(sorted.length>1)setActiveIndex(current=>(current-1+sorted.length)%sorted.length);}
  function next(){if(sorted.length>1)setActiveIndex(current=>(current+1)%sorted.length);}
  function onTouchEnd(event:React.TouchEvent){
    if(touchStart.current===null)return;
    const delta=event.changedTouches[0].clientX-touchStart.current;
    touchStart.current=null;
    if(Math.abs(delta)<45)return;
    if(delta>0)previous();else next();
  }

  if(!sorted.length){
    return <div className={styles.gallery} aria-label={`نمایش نمونه ${name}`}>
      <div className={styles.stage}><div className={styles.fallback}><span className={styles.fallbackLine}/><span className={styles.fallbackGem}><i/></span><small>تصویر محصول به‌زودی</small></div></div>
    </div>;
  }

  const active=sorted[activeIndex]??sorted[0];
  return <>
    <div className={styles.gallery} aria-label={`تصاویر ${name}`}>
      {showDesktopThumbs?<div className={styles.thumbnailRail} aria-label="انتخاب تصویر">
        {sorted.map((image,index)=><button
          type="button"
          className={index===activeIndex?styles.thumbnail+' '+styles.thumbnailActive:styles.thumbnail}
          onClick={()=>setActiveIndex(index)}
          aria-label={`نمایش ${labels[image.role]} ${index+1}`}
          aria-pressed={index===activeIndex}
          key={image.id}
        ><img src={variant(image.url,180,72)} alt="" loading="lazy" decoding="async" fetchPriority="low" /></button>)}
      </div>:sorted.length>1?<div className={styles.mobileIndicators} aria-label="انتخاب تصویر">
        {sorted.map((image,index)=><button
          type="button"
          className={index===activeIndex?styles.mobileIndicatorActive:styles.mobileIndicator}
          onClick={()=>setActiveIndex(index)}
          aria-label={`نمایش ${labels[image.role]} ${index+1}`}
          aria-pressed={index===activeIndex}
          key={image.id}
        ><span aria-hidden="true"/></button>)}
      </div>:null}

      <div className={styles.stageWrap}>
        <button
          type="button"
          className={styles.stage}
          onClick={()=>setLightboxOpen(true)}
          aria-label={`بزرگ‌نمایی تصویر ${active.altText||name}`}
          onTouchStart={event=>{touchStart.current=event.touches[0].clientX;}}
          onTouchEnd={onTouchEnd}
        >
          <picture className={styles.stagePicture}>
            <source media="(max-width: 620px)" srcSet={variant(active.url,900,80)}/>
            <img
              src={variant(active.url,1400,84)}
              alt={active.altText||`${name} - ${labels[active.role]}`}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              width={1200}
              height={1500}
            />
          </picture>
          <span className={styles.zoomHint} aria-hidden="true">⌕</span>
          <span className={styles.imageMeta}><b>{labels[active.role]}</b><small>{String(activeIndex+1).padStart(2,'0')} / {String(sorted.length).padStart(2,'0')}</small></span>
        </button>
        {sorted.length>1&&<div className={styles.inlineArrows} aria-label="جابجایی تصاویر"><button type="button" className={styles.prevArrow} onClick={previous} aria-label="تصویر قبلی">←</button><button type="button" className={styles.nextArrow} onClick={next} aria-label="تصویر بعدی">→</button></div>}
      </div>
    </div>

    {lightboxOpen&&<div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={`نمای بزرگ تصاویر ${name}`} onMouseDown={event=>{if(event.currentTarget===event.target)setLightboxOpen(false);}}>
      <div className={styles.lightboxTop}><span>{name}</span><button type="button" onClick={()=>setLightboxOpen(false)} aria-label="بستن تصویر بزرگ">×</button></div>
      <div className={styles.lightboxBody} onTouchStart={event=>{touchStart.current=event.touches[0].clientX;}} onTouchEnd={onTouchEnd}>
        {sorted.length>1&&<button type="button" className={styles.lightboxPrev} onClick={previous} aria-label="تصویر قبلی">←</button>}
        <img src={variant(active.url,1800,88)} alt={active.altText||`${name} - ${labels[active.role]}`} />
        {sorted.length>1&&<button type="button" className={styles.lightboxNext} onClick={next} aria-label="تصویر بعدی">→</button>}
      </div>
      <div className={styles.lightboxFooter}><span>{labels[active.role]}</span><b>{activeIndex+1} / {sorted.length}</b></div>
    </div>}
  </>;
}
