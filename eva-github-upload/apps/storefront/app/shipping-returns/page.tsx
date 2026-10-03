import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function ShippingReturnsPage(){
  return <InfoShell eyebrow="SHIPPING & RETURNS" title="از آماده‌سازی تا رسیدن به دست تو." lead="روند ارسال EVA طوری طراحی شده که وضعیت سفارش قابل پیگیری باشد. شرایط حقوقی و زمان‌بندی نهایی مرجوعی پیش از لانچ رسمی نهایی و منتشر می‌شود.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>FULFILLMENT</span><h2>مراحل سفارش</h2></div>
      <div className={styles.sectionContent}>
        <div className={styles.steps}>
          <div className={styles.step}><span>01</span><div><h3>ثبت شد</h3><p>پرداخت سفارش تأیید شده و سفارش وارد صف عملیات می‌شود.</p></div></div>
          <div className={styles.step}><span>02</span><div><h3>در حال آماده‌سازی</h3><p>قطعه، اطلاعات سفارش و بسته‌بندی برای ارسال آماده می‌شوند.</p></div></div>
          <div className={styles.step}><span>03</span><div><h3>آماده ارسال</h3><p>سفارش آماده تحویل به روش ارسال انتخاب‌شده است.</p></div></div>
          <div className={styles.step}><span>04</span><div><h3>ارسال شد</h3><p>روش ارسال، کد رهگیری و زمان ارسال روی سفارش ثبت می‌شوند.</p></div></div>
          <div className={styles.step}><span>05</span><div><h3>تحویل شد</h3><p>پس از تأیید تحویل، وضعیت سفارش در Timeline نهایی می‌شود.</p></div></div>
        </div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>TRACKING</span><h2>رهگیری بدون دردسر</h2></div>
      <div className={styles.grid2}>
        <article className={styles.card}><span>GUEST</span><h3>بدون ورود به حساب</h3><p>با شماره سفارش و همان شماره موبایل ثبت‌شده هنگام خرید، وضعیت را مشاهده کن.</p><a href="/track-order">رهگیری سفارش ←</a></article>
        <article className={styles.card}><span>MY EVA</span><h3>از حساب کاربری</h3><p>Timeline، فاکتور، روش ارسال و کد رهگیری سفارش‌های مرتبط با موبایل خودت را ببین.</p><a href="/account">حساب کاربری ←</a></article>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>CANCELLATION & RETURN</span><h2>لغو و مرجوعی</h2></div>
      <div className={styles.sectionContent}>
        <p>در نسخه فعلی آزمایشی سایت، Workflow کامل درخواست لغو و مرجوعی هنوز در حال تکمیل است. برای طلای فیزیکی لازم است شرایط قطعه، وضعیت ارسال، سلامت محصول و الزامات نهایی کسب‌وکار در تصمیم‌گیری لحاظ شوند.</p>
        <div className={styles.notice}>شرایط دقیق شامل بازه زمانی درخواست، موارد قابل یا غیرقابل مرجوعی، هزینه‌های احتمالی ارسال و فرآیند QC قبل از لانچ رسمی تعیین می‌شوند. این صفحه فعلاً چارچوب تجربه کاربری را نشان می‌دهد و متن نهایی سیاست تجاری یا حقوقی نیست.</div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>RETURN ≠ BUYBACK</span><h2>مرجوعی با بازخرید یکی نیست</h2></div>
      <div className={styles.sectionContent}>
        <p>در معماری EVA، «بازگرداندن سفارش خریداری‌شده» و «فروش دوباره طلا به EVA» دو فرآیند مستقل در نظر گرفته می‌شوند. هرکدام قواعد قیمت‌گذاری، بررسی و ثبت متفاوت خودشان را خواهند داشت.</p>
        <p>همچنین قطعه‌ای که از مشتری برمی‌گردد مستقیماً به موجودی قابل فروش برنمی‌گردد و قبل از هر تصمیم نیاز به کنترل کیفی خواهد داشت.</p>
      </div>
    </section>
  </InfoShell>;
}
