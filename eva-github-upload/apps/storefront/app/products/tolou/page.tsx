import ProductPurchase from './ProductPurchase';
import styles from './product.module.css';

export default function TolouPage() {
  return (
    <main className={styles.page}>
      <div className={styles.announcement}>ارسال امن • فاکتور معتبر • قیمت شفاف</div>
      <header className={styles.header}>
        <a className={styles.brand} href="/">EVA</a>
        <nav><a href="/shop">فروشگاه</a><a href="/#collection">کالکشن‌ها</a><a href="/#gift">هدیه</a><a href="/#lightweight">طلای سبک</a></nav>
        <div className={styles.actions}><button>⌕</button><button>♡</button><button className={styles.cart}>سبد ۰</button></div>
      </header>

      <div className={styles.breadcrumb}><a href="/">خانه</a><span>/</span><a href="/shop">فروشگاه</a><span>/</span><span>طلوع</span></div>

      <section className={styles.productHero}>
        <div className={styles.gallery}>
          <div className={`${styles.galleryCard} ${styles.galleryMain}`}>
            <div className={styles.heroJewel}><span className={styles.chain} /><span className={styles.pendant}><i /></span></div>
            <span className={styles.imageLabel}>نمای اصلی</span>
          </div>
          <div className={styles.galleryCard}><div className={styles.onBody}><span className={styles.neck} /><span className={styles.bodyChain} /><span className={styles.bodyPendant} /></div><span className={styles.imageLabel}>نمای روی بدن</span></div>
          <div className={styles.galleryCard}><div className={styles.detailJewel}><span /></div><span className={styles.imageLabel}>جزئیات</span></div>
        </div>
        <ProductPurchase />
      </section>

      <section className={styles.storySection}>
        <div><span className={styles.eyebrow}>THE STORY</span><h2>داستان طلوع</h2></div>
        <p>«طلوع» از لحظه‌ای الهام گرفته که اولین نور، مرز تاریکی را باز می‌کند. فرم باز و نقطه مرکزی آن، یادآور شروعی است که هنوز امکان ادامه دارد؛ قطعه‌ای سبک برای حضور هرروزه، بدون اینکه بی‌هویت باشد.</p>
      </section>

      <section className={styles.detailsSection}>
        <div><span className={styles.eyebrow}>DETAILS</span><h2>مشخصات محصول</h2></div>
        <dl>
          <div><dt>دسته</dt><dd>گردنبند</dd></div>
          <div><dt>کالکشن</dt><dd>آغاز</dd></div>
          <div><dt>عیار</dt><dd>۱۸ عیار</dd></div>
          <div><dt>رنگ طلا</dt><dd>زرد</dd></div>
          <div><dt>سبک</dt><dd>مینیمال / روزمره</dd></div>
          <div><dt>SKU</dt><dd dir="ltr">EVA-AGH-NEC-TOL-001</dd></div>
        </dl>
      </section>

      <section className={styles.assuranceSection}>
        <article><span>01</span><h3>اصالت</h3><p>مشخصات هر قطعه با وزن و عیار همان Unit ثبت می‌شود.</p></article>
        <article><span>02</span><h3>فاکتور</h3><p>فاکتور خرید به قطعه و قیمت ثبت‌شده سفارش متصل خواهد بود.</p></article>
        <article><span>03</span><h3>بسته‌بندی</h3><p>بسته‌بندی EVA برای سفارش شخصی یا هدیه طراحی شده است.</p></article>
      </section>

      <footer className={styles.footer}><a className={styles.brand} href="/">EVA</a><p>بوتیک آنلاین طلای معاصر؛ طراحی ظریف و خرید شفاف.</p></footer>
    </main>
  );
}
