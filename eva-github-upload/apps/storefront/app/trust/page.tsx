import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function TrustPage(){
  return <InfoShell eyebrow="EVA TRUST CENTER" title="اعتماد، بخشی از خود محصول است." lead="در EVA تلاش می‌کنیم چیزی که می‌خری، مبلغی که می‌پردازی و مسیری که سفارش طی می‌کند قابل مشاهده و قابل پیگیری باشد.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>FOUR PROMISES</span><h2>چهار اصل اعتماد</h2></div>
      <div className={styles.grid2}>
        <article className={styles.card}><span>01</span><h3>وزن دقیق</h3><p>هر قطعه فیزیکی یک Unit مستقل دارد و وزن همان قطعه در زمان انتخاب نمایش داده می‌شود.</p></article>
        <article className={styles.card}><span>02</span><h3>قیمت شفاف</h3><p>در صفحه محصول می‌توانی اجزای قیمت و قیمت نهایی Unit انتخاب‌شده را ببینی.</p></article>
        <article className={styles.card}><span>03</span><h3>فاکتور قابل بررسی</h3><p>پس از خرید موفق، فاکتور به همان سفارش و همان قطعه متصل می‌ماند و صفحه Verify عمومی دارد.</p></article>
        <article className={styles.card}><span>04</span><h3>رهگیری سفارش</h3><p>وضعیت آماده‌سازی، ارسال و تحویل سفارش از حساب کاربری یا رهگیری مهمان قابل مشاهده است.</p></article>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>PRICE TRANSPARENCY</span><h2>قیمت چطور ثبت می‌شود؟</h2></div>
      <div className={styles.sectionContent}>
        <div className={styles.steps}>
          <div className={styles.step}><span>01</span><div><h3>انتخاب Unit</h3><p>اگر یک مدل چند وزن موجود داشته باشد، هر وزن به‌صورت جدا انتخاب می‌شود.</p></div></div>
          <div className={styles.step}><span>02</span><div><h3>محاسبه قیمت</h3><p>موتور قیمت‌گذاری روی وزن همان Unit اجرا می‌شود و اجزای محاسبه نگهداری می‌شوند.</p></div></div>
          <div className={styles.step}><span>03</span><div><h3>قفل کوتاه‌مدت هنگام خرید</h3><p>برای جلوگیری از تغییر یا فروش هم‌زمان، قطعه در مسیر Checkout برای مدت محدود رزرو می‌شود.</p></div></div>
          <div className={styles.step}><span>04</span><div><h3>Snapshot فاکتور</h3><p>پس از پرداخت، اطلاعات قیمت و قطعه در سفارش و فاکتور ثبت می‌شوند تا خرید گذشته با تغییر نرخ‌های آینده عوض نشود.</p></div></div>
        </div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>CHECK IT YOURSELF</span><h2>خودت بررسی کن</h2></div>
      <div className={styles.linkGrid}>
        <a className={styles.linkCard} href="/track-order"><span>ORDER TRACKING</span><h3>رهگیری سفارش</h3><p>با شماره سفارش و موبایل ثبت‌شده، وضعیت ارسال را ببین.</p><b>رهگیری ←</b></a>
        <a className={styles.linkCard} href="/account"><span>MY EVA</span><h3>حساب کاربری</h3><p>سفارش‌ها، Timeline، فاکتور و کد رهگیری را یک‌جا ببین.</p><b>ورود به حساب ←</b></a>
        <a className={styles.linkCard} href="/faq"><span>QUESTIONS</span><h3>سوالات متداول</h3><p>پاسخ کوتاه به سوال‌های رایج درباره خرید، قیمت و سفارش.</p><b>مشاهده FAQ ←</b></a>
      </div>
    </section>
  </InfoShell>;
}
