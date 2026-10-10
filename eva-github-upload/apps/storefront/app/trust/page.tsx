import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function TrustPage(){
  return <InfoShell eyebrow="EVA TRUST CENTER" title="اعتماد، بخشی از خود محصول است." lead="در ایوا تلاش می‌کنیم چیزی که می‌خری، مبلغی که می‌پردازی و مسیری که سفارش طی می‌کند قابل مشاهده و قابل پیگیری باشد.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>FOUR PROMISES</span><h2>چهار اصل اعتماد</h2></div>
      <div className={styles.grid2}>
        <article className={styles.card}><span>01</span><h3>وزن دقیق</h3><p>هر قطعه فیزیکی وزن مستقل خودش را دارد و همان وزن هنگام انتخاب نمایش داده می‌شود.</p></article>
        <article className={styles.card}><span>02</span><h3>قیمت شفاف</h3><p>قیمت نهایی قطعه انتخاب‌شده قبل از ادامه خرید مشخص است و به همان قطعه متصل می‌ماند.</p></article>
        <article className={styles.card}><span>03</span><h3>فاکتور قابل بررسی</h3><p>پس از خرید موفق، اطلاعات همه قطعات سفارش در فاکتور ثبت می‌شوند و فاکتور صفحه تأیید عمومی دارد.</p></article>
        <article className={styles.card}><span>04</span><h3>رهگیری سفارش</h3><p>وضعیت آماده‌سازی، ارسال و تحویل از حساب کاربری یا رهگیری مهمان قابل مشاهده است.</p></article>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>PRICE TRANSPARENCY</span><h2>قیمت چطور ثبت می‌شود؟</h2></div>
      <div className={styles.sectionContent}>
        <div className={styles.steps}>
          <div className={styles.step}><span>01</span><div><h3>انتخاب قطعه</h3><p>اگر یک مدل چند وزن موجود داشته باشد، هر وزن به‌صورت مستقل انتخاب می‌شود.</p></div></div>
          <div className={styles.step}><span>02</span><div><h3>قیمت همان قطعه</h3><p>قیمت بر اساس مشخصات همان قطعه محاسبه و پیش از ثبت سفارش نمایش داده می‌شود.</p></div></div>
          <div className={styles.step}><span>03</span><div><h3>رزرو کوتاه‌مدت در Checkout</h3><p>برای جلوگیری از فروش هم‌زمان، قطعات انتخاب‌شده هنگام Checkout برای مدت محدود رزرو می‌شوند.</p></div></div>
          <div className={styles.step}><span>04</span><div><h3>ثبت در سفارش و فاکتور</h3><p>پس از پرداخت موفق، مشخصات و قیمت قطعات در سفارش و فاکتور همان خرید ثبت می‌شوند.</p></div></div>
        </div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>CHECK IT YOURSELF</span><h2>خودت بررسی کن</h2></div>
      <div className={styles.linkGrid}>
        <a className={styles.linkCard} href="/track-order"><span>ORDER TRACKING</span><h3>رهگیری سفارش</h3><p>با شماره سفارش و موبایل ثبت‌شده، وضعیت سفارش را ببین.</p><b>رهگیری ←</b></a>
        <a className={styles.linkCard} href="/account"><span>MY EVA</span><h3>حساب کاربری</h3><p>سفارش‌ها، وضعیت ارسال، فاکتور و کد رهگیری را یک‌جا ببین.</p><b>ورود به حساب ←</b></a>
        <a className={styles.linkCard} href="/faq"><span>QUESTIONS</span><h3>سوالات متداول</h3><p>پاسخ کوتاه به سوال‌های رایج درباره خرید، قیمت و سفارش.</p><b>مشاهده FAQ ←</b></a>
      </div>
    </section>
  </InfoShell>;
}
