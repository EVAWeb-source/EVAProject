import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function HelpPage(){
  return <InfoShell eyebrow="EVA HELP CENTER" title="چطور می‌توانیم راه را کوتاه‌تر کنیم؟" lead="از پیدا کردن محصول تا پیگیری سفارش، مسیرهای اصلی راهنما را یک‌جا گذاشته‌ایم تا برای یک سوال ساده مجبور نباشی بین صفحه‌ها بگردی.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>QUICK HELP</span><h2>دنبال چه چیزی هستی؟</h2></div>
      <div className={styles.linkGrid}>
        <a className={styles.linkCard} href="/track-order"><span>01</span><h3>رهگیری سفارش</h3><p>شماره سفارش و موبایل را وارد کن و وضعیت آماده‌سازی تا تحویل را ببین.</p><b>رهگیری ←</b></a>
        <a className={styles.linkCard} href="/account"><span>02</span><h3>حساب و سفارش‌های من</h3><p>سفارش‌ها، فاکتور، وضعیت ارسال و اطلاعات سفارش‌های قبلی.</p><b>حساب کاربری ←</b></a>
        <a className={styles.linkCard} href="/faq"><span>03</span><h3>سوالات متداول</h3><p>جواب سوال‌های رایج درباره قیمت، موجودی، خرید، ارسال و هدیه.</p><b>مشاهده سوال‌ها ←</b></a>
        <a className={styles.linkCard} href="/shipping-returns"><span>04</span><h3>ارسال و مرجوعی</h3><p>روند آماده‌سازی، ارسال، تحویل و چارچوب فعلی درخواست لغو یا مرجوعی.</p><b>مطالعه راهنما ←</b></a>
        <a className={styles.linkCard} href="/trust"><span>05</span><h3>اعتماد و شفافیت</h3><p>وزن دقیق، قیمت، فاکتور و اینکه EVA چطور هر قطعه را مدیریت می‌کند.</p><b>Trust Center ←</b></a>
        <a className={styles.linkCard} href="/contact"><span>06</span><h3>تماس با EVA</h3><p>برای سوالی که در راهنما جوابش را پیدا نکردی، مسیر تماس را ببین.</p><b>تماس ←</b></a>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>SHOPPING HELP</span><h2>برای انتخاب محصول</h2></div>
      <div className={styles.grid3}>
        <article className={styles.card}><span>BY TYPE</span><h3>بر اساس نوع</h3><p>گردنبند، انگشتر، دستبند، گوشواره و دسته‌های دیگر را جدا ببین.</p><a href="/shop">فروشگاه ←</a></article>
        <article className={styles.card}><span>BY STORY</span><h3>بر اساس کالکشن</h3><p>اگر داستان و زبان طراحی مهم‌تر است، از کالکشن‌ها شروع کن.</p><a href="/collections">کالکشن‌ها ←</a></article>
        <article className={styles.card}><span>BY NEED</span><h3>هدیه یا طلای سبک</h3><p>برای هدیه از Gift Finder و برای وزن‌های کمتر از مسیر طلای سبک استفاده کن.</p><a href="/gift">Gift Hub ←</a></article>
      </div>
    </section>
  </InfoShell>;
}
