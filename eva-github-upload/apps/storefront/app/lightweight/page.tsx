import type { Metadata } from 'next';
import Link from 'next/link';
import LightweightCatalog from './LightweightCatalog';
import type { CatalogProduct } from '../components/CatalogGrid';
import { publicMetadata } from '../lib/seo';
import styles from './lightweight.module.css';

export const dynamic='force-dynamic';

export const metadata:Metadata=publicMetadata({
  title:'طلای سبک | ایوا',
  description:'قطعه‌های سبک ایوا با Unitهای زیر یک گرم، وزن دقیق و قیمت شفاف.',
  path:'/lightweight',
});

async function getProducts():Promise<CatalogProduct[]> {
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase+'/api/v1/products',{cache:'no-store'});
  if(!response.ok)throw new Error('Failed to load EVA catalog: '+response.status);
  return response.json();
}

function primaryImage(products:CatalogProduct[]){
  for(const product of products){
    const sorted=[...(product.images??[])].sort((a,b)=>a.sortOrder-b.sortOrder);
    const image=sorted.find(item=>item.role==='MAIN')??sorted[0];
    if(image)return {image,product};
  }
  return null;
}

export default async function LightweightPage(){
  const products=await getProducts();
  const lightweight=products.filter(product=>product.units.some(unit=>Number(unit.exactWeightGram)<1));
  const hero=primaryImage(lightweight);
  const weights=lightweight.flatMap(product=>product.units.map(unit=>Number(unit.exactWeightGram))).filter(value=>value<1&&Number.isFinite(value));
  const minWeight=weights.length?Math.min(...weights):null;

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><span>طلای سبک</span></div>

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span>LIGHTWEIGHT GOLD</span>
        <h1>طلای سبک، برای استفاده بیشتر.</h1>
        <p>این صفحه فقط محصولاتی را نشان می‌دهد که حداقل یک Unit زیر یک گرم دارند؛ وزن و قیمت دقیق هر قطعه در انتخاب نهایی حفظ می‌شود.</p>
        <a href="#lightweight-catalog">مشاهده قطعه‌های سبک</a>
        <small>{new Intl.NumberFormat('fa-IR').format(lightweight.length)} محصول{minWeight!==null?` • شروع وزن از ${new Intl.NumberFormat('fa-IR',{maximumFractionDigits:3}).format(minWeight)} گرم`:''}</small>
      </div>
      <div className={styles.heroVisual}>
        {hero?<img src={hero.image.url} alt={hero.image.altText||hero.product.nameFa} decoding="async" fetchPriority="high"/>:<div className={styles.heroArt} aria-hidden="true"><div className={styles.halo}/><span className={styles.chain}/><span className={styles.pendant}/></div>}
        <div className={styles.weightTag}><strong>&lt; ۱ گرم</strong><span>LIVE UNIT FILTER</span></div>
      </div>
    </section>

    <section className={styles.definition}>
      <div><span>WHAT LIGHTWEIGHT MEANS</span><h2>سبک یعنی وزن کمتر؛ نه اطلاعات کمتر.</h2></div>
      <p>ممکن است یک مدل چند Unit با وزن متفاوت داشته باشد. در این صفحه فقط Unitهای زیر یک گرم وارد انتخاب می‌شوند و قیمت هر گزینه بر اساس همان Unit واقعی نمایش داده می‌شود.</p>
    </section>

    <div id="lightweight-catalog"><LightweightCatalog products={lightweight}/></div>

    <section className={styles.why}>
      <div className={styles.whyHead}><span>WHY LIGHTWEIGHT</span><h2>چه زمانی انتخاب خوبی است؟</h2></div>
      <div className={styles.whyGrid}>
        <article><span>01</span><h3>استفاده روزمره</h3><p>وزن کمتر برای قطعه‌ای که قرار است ساعت‌های بیشتری همراهت باشد انتخاب راحت‌تری است.</p></article>
        <article><span>02</span><h3>شروع خرید طلا</h3><p>برای شروع با بودجه کنترل‌شده‌تر، بدون حذف شفافیت وزن و قیمت.</p></article>
        <article><span>03</span><h3>لایه‌سازی</h3><p>قطعه‌های سبک برای ترکیب چند گردنبند، دستبند یا انگشتر آزادی بیشتری می‌دهند.</p></article>
        <article><span>04</span><h3>هدیه ظریف</h3><p>برای کسی که طراحی کم‌حجم و قابل‌استفاده در موقعیت‌های مختلف را ترجیح می‌دهد.</p></article>
      </div>
    </section>

    <section className={styles.transparency}>
      <div><span>TRANSPARENCY</span><h2>عدد وزن بخشی از انتخاب است.</h2></div>
      <div><p>«سبک» در ایوا فقط یک عنوان نیست. وزن هر Unit جدا ثبت می‌شود و انتخاب نهایی روی همان قطعه انجام می‌شود.</p><Link href="/trust">درباره شفافیت ایوا <span>←</span></Link></div>
    </section>
  </main>;
}
