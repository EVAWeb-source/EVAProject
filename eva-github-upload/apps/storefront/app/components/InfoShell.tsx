import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './InfoShell.module.css';

type ProductImage = { url:string; altText?:string|null; role?:string|null; sortOrder?:number|null };
type CatalogProduct = { nameFa?:string; images?:ProductImage[] };

type EditorialImage = { url:string; alt:string };

async function getEditorialImages(eyebrow:string): Promise<EditorialImage[]> {
  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  try {
    const response = await fetch(`${apiBase}/api/v1/products`, { cache: 'no-store' });
    if (!response.ok) return [];
    const products = await response.json() as CatalogProduct[];
    const images = products.flatMap((product) => {
      const sorted = [...(product.images ?? [])].sort((a,b)=>(a.sortOrder ?? 0)-(b.sortOrder ?? 0));
      const primary = sorted.find((image)=>image.role === 'MAIN') ?? sorted[0];
      return primary?.url ? [{ url: primary.url, alt: primary.altText || product.nameFa || 'محصول ایوا' }] : [];
    });
    const unique = images.filter((image,index,array)=>array.findIndex((item)=>item.url===image.url)===index);
    if (!unique.length) return [];
    const seed = Array.from(eyebrow).reduce((sum,char)=>sum+char.charCodeAt(0),0) % unique.length;
    return Array.from({length:Math.min(3,unique.length)},(_,index)=>unique[(seed+index)%unique.length]);
  } catch {
    return [];
  }
}

export default async function InfoShell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  const images = await getEditorialImages(eyebrow);

  return <main className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{lead}</p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryAction} href="/shop">دیدن فروشگاه <i>←</i></Link>
          <Link className={styles.secondaryAction} href="/track-order">رهگیری سفارش</Link>
        </div>
      </div>

      <div className={styles.heroVisual} aria-label="محصولات ایوا">
        {images.length ? <>
          <figure className={styles.visualMain}><img src={images[0].url} alt={images[0].alt} loading="eager" decoding="async" /></figure>
          {images[1] && <figure className={styles.visualSmallTop}><img src={images[1].url} alt={images[1].alt} loading="lazy" decoding="async" /></figure>}
          {images[2] && <figure className={styles.visualSmallBottom}><img src={images[2].url} alt={images[2].alt} loading="lazy" decoding="async" /></figure>}
          <span className={styles.visualBadge}>EVA • GOLD FOR EVERYDAY</span>
        </> : <div className={styles.visualFallback}><img src="/brand/eva-mark.webp" alt="EVA" /></div>}
      </div>
    </section>

    <section className={styles.trustRail} aria-label="شفافیت خرید در ایوا">
      <div><i>01</i><span>وزن هر قطعه</span><strong>دقیق و مستقل</strong></div>
      <div><i>02</i><span>قیمت و فاکتور</span><strong>قابل بررسی</strong></div>
      <div><i>03</i><span>وضعیت سفارش</span><strong>قابل رهگیری</strong></div>
    </section>

    <section className={styles.accessBlock}>
      <div className={styles.accessIntro}><span>QUICK ACCESS</span><h2>از کجا می‌خواهی ادامه بدهی؟</h2><p>مسیرهای اصلی خرید و پشتیبانی را مستقیم باز کن.</p></div>
      <nav className={styles.serviceNav} aria-label="دسترسی سریع ایوا">
        <Link href="/shop"><span>SHOP</span><strong>فروشگاه</strong><i>←</i></Link>
        <Link href="/account"><span>MY EVA</span><strong>حساب کاربری</strong><i>←</i></Link>
        <Link href="/track-order"><span>TRACK</span><strong>رهگیری سفارش</strong><i>←</i></Link>
        <Link href="/trust"><span>TRUST</span><strong>اعتماد و شفافیت</strong><i>←</i></Link>
        <Link href="/faq"><span>FAQ</span><strong>سوالات متداول</strong><i>←</i></Link>
        <Link href="/contact"><span>SUPPORT</span><strong>تماس و راهنما</strong><i>←</i></Link>
      </nav>
    </section>

    <div className={styles.body}>{children}</div>
  </main>;
}
