import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function ShippingReturnsPage(){
  return <InfoShell eyebrow="SHIPPING & RETURNS" title="از آماده‌سازی تا رسیدن به دست تو." lead="مسیر سفارش در ایوا طوری طراحی شده که هر مرحله قابل مشاهده و پیگیری باشد. جزئیات نهایی سیاست مرجوعی پیش از لانچ رسمی منتشر می‌شود.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>FULFILLMENT</span><h2>مراحل سفارش</h2></div>
      <div className={styles.sectionContent}>
        <div className={styles.steps}>
          <div className={styles.step}><span>01</span><div><h3>ثبت شد</h3><p>پرداخت تأیید شده و سفارش وارد مرحله آماده‌سازی می‌شود.</p></div></div>
          <div className={styles.step}><span>02</span><div><h3>در حال آماده‌سازی</h3><p>قطعات سفارش و اطلاعات ارسال بررسی و برای تحویل آماده می‌شوند.</p></div></div>
          <div className={styles.step}><span>03</span><div><h3>آماده ارسال</h3><p>سفارش برای تحویل به روش ارسال انتخاب‌شده آماده است.</p></div></div>
          <div className={styles.step}><span>04</span><div><h3>ارسال شد</h3><p>روش ارسال، کد رهگیری و زمان ارسال روی سفارش ثبت می‌شوند.</p></div></div>
          <div className={styles.step}><span>05</span><div><h3>تحویل شد</h3><p>پس از ثبت تحویل، وضعیت سفارش در Timeline تکمیل می‌شود.</p></div></div>
        </div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>TRACKING</span><h2>دو مسیر برای رهگیری</h2></div>
      <div className={styles.grid2}>
        <article className={styles.card}><span>GUEST</span><h3>بدون ورود به حساب</h3><p>با شماره سفارش و همان شماره موبایل ثبت‌شده هنگام خرید، وضعیت سفارش را مشاهده کن.</p><a href="/track-order">رهگیری سفارش ←</a></article>
        <article className={styles.card}><span>MY EVA</span><h3>از حساب کاربری</h3><p>همه سفارش‌ها، وضعیت ارسال، فاکتور و کد رهگیری را در داشبورد حساب ببین.</p><a href="/account">حساب کاربری ←</a></article>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>CANCELLATION & RETURN</span><h2>لغو و مرجوعی</h2></div>
      <div className={styles.sectionContent}>
        <p>برای طلای فیزیکی، شرایط قطعه، وضعیت ارسال، سلامت محصول و نتیجه بررسی کیفی در فرآیند لغو یا مرجوعی اهمیت دارند.</p>
        <div className={styles.notice}>بازه زمانی درخواست، موارد قابل یا غیرقابل مرجوعی، هزینه‌های احتمالی ارسال و شرایط بررسی کیفی هنوز سیاست نهایی تجاری ایوا نیستند و پیش از لانچ رسمی به‌صورت شفاف در همین صفحه منتشر خواهند شد.</div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>RETURN ≠ BUYBACK</span><h2>مرجوعی با بازخرید یکی نیست</h2></div>
      <div className={styles.sectionContent}>
        <p>«بازگرداندن یک سفارش» و «فروش دوباره طلا به ایوا» دو فرآیند متفاوت‌اند و قواعد قیمت‌گذاری و بررسی یکسانی ندارند.</p>
        <p>همچنین قطعه‌ای که از مشتری برمی‌گردد مستقیماً به موجودی قابل فروش اضافه نمی‌شود و پیش از هر تصمیم نیاز به بررسی کیفی دارد.</p>
      </div>
    </section>
  </InfoShell>;
}
