import type { Metadata } from 'next';
import Link from 'next/link';
import GiftFinder from './GiftFinder';
import type { CatalogProduct } from '../components/CatalogGrid';
import { publicMetadata } from '../lib/seo';
import styles from './gift.module.css';

export const dynamic='force-dynamic';

export const metadata:Metadata=publicMetadata({
  title:'راهنمای انتخاب هدیه طلا | ایوا',
  description:'با بودجه، مناسبت و گیرنده شروع کن و از میان قطعه‌های موجود ایوا پیشنهاد هدیه بگیر.',
  path:'/gift',
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

export default async function GiftPage(){
  const products=await getProducts();
  const hero=primaryImage(products);

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><span>راهنمای هدیه</span></div>

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span>EVA GIFT EDIT</span>
        <h1>هدیه‌ای که انتخابش ساده‌تر باشد.</h1>
        <p>بودجه، مناسبت و کسی که برایش خرید می‌کنی را مشخص کن؛ پیشنهادها فقط از میان قطعه‌های موجود ایوا ساخته می‌شوند.</p>
        <a href="#gift-finder">پیدا کردن هدیه</a>
        <small>{new Intl.NumberFormat('fa-IR').format(products.filter(product=>product.units.length>0).length)} محصول موجود برای بررسی</small>
      </div>

      <div className={styles.heroVisual}>
        {hero?<img src={hero.image.url} alt={hero.image.altText||hero.product.nameFa} decoding="async" fetchPriority="high"/>:<div className={styles.giftArt} aria-hidden="true"><div className={styles.boxLid}><span>EVA</span></div><div className={styles.boxBase}/><div className={styles.ribbon}/></div>}
        <div className={styles.heroCaption}><span>CURATED GIFT</span><b>{hero?.product.nameFa??'انتخاب ایوا'}</b></div>
      </div>
    </section>

    <div id="gift-finder"><GiftFinder products={products}/></div>

    <section className={styles.experience}>
      <div className={styles.experienceHead}><span>GIFT EXPERIENCE</span><h2>یک مسیر کوتاه برای انتخاب بهتر.</h2><p>هدف این صفحه کم‌کردن گزینه‌های اضافی است؛ نه پنهان‌کردن وزن، قیمت یا مشخصات قطعه.</p></div>
      <div className={styles.experienceGrid}>
        <article><span>01</span><h3>بودجه واقعی</h3><p>پیشنهادها با قیمت Unitهای موجود سنجیده می‌شوند، نه با قیمت نمونه یا تخمینی.</p></article>
        <article><span>02</span><h3>انتخاب متناسب</h3><p>مناسبت و گیرنده فقط برای اولویت‌بندی نوع قطعه استفاده می‌شوند و تصمیم نهایی با توست.</p></article>
        <article><span>03</span><h3>شفافیت محصول</h3><p>وزن دقیق، عیار، قیمت و موجودی هر قطعه در صفحه محصول قابل بررسی است.</p></article>
        <article><span>04</span><h3>مسیر هدیه در سبد</h3><p>در سبد خرید می‌توانی سفارش را به‌عنوان هدیه مشخص کنی و تنظیمات مربوط به آن را ببینی.</p></article>
      </div>
    </section>

    <section className={styles.giftTrust}>
      <div><span>NO GUESSWORK</span><h2>هدیه بودن، شفافیت خرید را تغییر نمی‌دهد.</h2></div>
      <div><p>قبل از پرداخت، قطعه مشخص، وزن دقیق همان Unit، عیار و قیمت نهایی را می‌بینی. اگر هنوز مطمئن نیستی، می‌توانی همه محصولات را بدون محدودیت Gift Finder بررسی کنی.</p><Link href="/shop">مشاهده همه محصولات <span>←</span></Link></div>
    </section>
  </main>;
}
