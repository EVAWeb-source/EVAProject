import styles from './ProductMediaGallery.module.css';

type ProductImage={id:string;url:string;altText:string;role:'MAIN'|'GALLERY'|'ON_BODY'|'DETAIL';sortOrder:number};

const labels:Record<ProductImage['role'],string>={MAIN:'نمای اصلی',GALLERY:'گالری',ON_BODY:'نمای روی بدن',DETAIL:'جزئیات'};
const roleOrder:Record<ProductImage['role'],number>={MAIN:0,ON_BODY:1,DETAIL:2,GALLERY:3};

export default function ProductMediaGallery({images,name}:{images:ProductImage[];name:string}){
  const sorted=[...images].sort((a,b)=>{
    const roleDiff=roleOrder[a.role]-roleOrder[b.role];
    return roleDiff!==0?roleDiff:a.sortOrder-b.sortOrder;
  });

  if(sorted.length){
    return <div className={styles.gallery} aria-label={`تصاویر ${name}`}>
      {sorted.map((image,index)=><figure className={index===0?styles.card+' '+styles.main:styles.card} key={image.id}>
        <img
          src={image.url}
          alt={image.altText||`${name} - ${labels[image.role]}`}
          loading={index===0?'eager':'lazy'}
          decoding="async"
          fetchPriority={index===0?'high':'auto'}
          width={1200}
          height={1500}
        />
        <figcaption><span>{String(index+1).padStart(2,'0')}</span><b>{labels[image.role]??'تصویر محصول'}</b></figcaption>
      </figure>)}
    </div>;
  }

  return <div className={styles.gallery} aria-label={`نمایش نمونه ${name}`}>
    <div className={styles.card+' '+styles.main}><div className={styles.heroJewel}><span className={styles.chain}/><span className={styles.pendant}><i/></span></div><span className={styles.label}>نمای اصلی</span></div>
    <div className={styles.card}><div className={styles.onBody}><span className={styles.neck}/><span className={styles.bodyChain}/><span className={styles.bodyPendant}/></div><span className={styles.label}>نمای روی بدن</span></div>
    <div className={styles.card}><div className={styles.detail}><span/></div><span className={styles.label}>جزئیات</span></div>
  </div>;
}
