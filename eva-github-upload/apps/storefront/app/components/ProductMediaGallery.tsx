import styles from './ProductMediaGallery.module.css';

type ProductImage={id:string;url:string;altText:string;role:'MAIN'|'GALLERY'|'ON_BODY'|'DETAIL';sortOrder:number};

const labels:Record<ProductImage['role'],string>={MAIN:'نمای اصلی',GALLERY:'گالری',ON_BODY:'نمای روی بدن',DETAIL:'جزئیات'};

export default function ProductMediaGallery({images,name}:{images:ProductImage[];name:string}){
  if(images.length){
    return <div className={styles.gallery}>
      {images.map((image,index)=><figure className={index===0?styles.card+' '+styles.main:styles.card} key={image.id}>
        <img
          src={image.url}
          alt={image.altText||name}
          loading={index===0?'eager':'lazy'}
          decoding="async"
          fetchPriority={index===0?'high':'auto'}
          width={1200}
          height={1500}
        />
        <figcaption>{labels[image.role]??'تصویر محصول'}</figcaption>
      </figure>)}
    </div>;
  }

  return <div className={styles.gallery}>
    <div className={styles.card+' '+styles.main}><div className={styles.heroJewel}><span className={styles.chain}/><span className={styles.pendant}><i/></span></div><span className={styles.label}>نمای اصلی</span></div>
    <div className={styles.card}><div className={styles.onBody}><span className={styles.neck}/><span className={styles.bodyChain}/><span className={styles.bodyPendant}/></div><span className={styles.label}>نمای روی بدن</span></div>
    <div className={styles.card}><div className={styles.detail}><span/></div><span className={styles.label}>جزئیات</span></div>
  </div>;
}
