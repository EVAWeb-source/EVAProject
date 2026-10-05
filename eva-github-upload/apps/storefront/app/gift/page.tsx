import GiftFinder from './GiftFinder';
import type { CatalogProduct } from '../components/CatalogGrid';
import styles from './gift.module.css';

export const dynamic='force-dynamic';

async function getProducts():Promise<CatalogProduct[]> {
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase+'/api/v1/products',{cache:'no-store'});
  if(!response.ok)throw new Error('Failed to load EVA catalog: '+response.status);
  return response.json();
}

export default async function GiftPage(){
  const products=await getProducts();

  return <main className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span>EVA GIFT</span>
        <h1>هدیه‌ای که انتخابش هم حس خوبی داشته باشد.</h1>
        <p>از بودجه و مناسبت شروع کن. EVA از میان قطعه‌های واقعاً موجود، انتخاب‌ها را برایت مرتب می‌کند.</p>
        <a href="#gift-finder">پیدا کردن هدیه</a>
      </div>
      <div className={styles.giftArt} aria-hidden="true">
        <div className={styles.boxLid}><span>EVA</span></div>
        <div className={styles.boxBase}/>
        <div className={styles.ribbon}/>
        <div className={styles.card}>برای لحظه‌ای که می‌ماند.</div>
      </div>
    </section>

    <div id="gift-finder"><GiftFinder products={products}/></div>

    <section className={styles.experience}>
      <div className={styles.experienceHead}><span>GIFT EXPERIENCE</span><h2>هدیه فقط خود قطعه نیست.</h2><p>مسیر هدیه EVA برای تجربه‌ای ساده، محترمانه و قابل‌کنترل طراحی شده است.</p></div>
      <div className={styles.experienceGrid}>
        <article><span>01</span><h3>بسته‌بندی EVA</h3><p>بسته‌بندی مناسب هدیه، بدون نیاز به درخواست جداگانه برای سفارش‌های Gift.</p></article>
        <article><span>02</span><h3>پیام هدیه</h3><p>امکان ثبت یک پیام کوتاه برای همراهی سفارش در مرحله نهایی خرید.</p></article>
        <article><span>03</span><h3>بدون نمایش قیمت</h3><p>برای ارسال مستقیم به گیرنده، قیمت روی بسته هدیه نمایش داده نمی‌شود.</p></article>
        <article><span>04</span><h3>ارسال مستقیم</h3><p>آدرس گیرنده می‌تواند با خریدار متفاوت باشد و سفارش مستقیماً برای او ارسال شود.</p></article>
      </div>
    </section>

    <section className={styles.giftTrust}>
      <div><span>NO GUESSWORK</span><h2>وزن و قیمت همچنان شفاف می‌ماند.</h2></div>
      <p>هدیه بودن سفارش چیزی از شفافیت خرید کم نمی‌کند؛ وزن دقیق Unit، عیار و قیمت نهایی قبل از پرداخت مشخص است و فاکتور سفارش در حساب خریدار باقی می‌ماند.</p>
    </section>
  </main>;
}
