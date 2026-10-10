import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function ContactPage(){
  return <InfoShell eyebrow="CONTACT EVA" title="برای هر سوال، مسیر درستش." lead="برای پیگیری سفارش، پاسخ به سوال‌های رایج و موضوعات پس از خرید، مسیر مناسب را از همین صفحه پیدا کن. کانال‌های رسمی پشتیبانی در مرحله اتصال سرویس‌ها فعال می‌شوند.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>START HERE</span><h2>سریع‌تر به جواب برس</h2></div>
      <div className={styles.linkGrid}>
        <a className={styles.linkCard} href="/track-order"><span>ORDER</span><h3>وضعیت سفارش</h3><p>برای آماده‌سازی، ارسال یا تحویل، مستقیم سفارش را رهگیری کن.</p><b>رهگیری ←</b></a>
        <a className={styles.linkCard} href="/faq"><span>QUESTIONS</span><h3>سوال عمومی</h3><p>پاسخ سوال‌های رایج درباره قیمت، وزن، خرید، فاکتور و حساب کاربری.</p><b>FAQ ←</b></a>
        <a className={styles.linkCard} href="/shipping-returns"><span>AFTER SALES</span><h3>ارسال و مرجوعی</h3><p>روند ارسال و چارچوب فعلی درخواست‌های پس از خرید.</p><b>راهنما ←</b></a>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>SUPPORT CHANNELS</span><h2>کانال‌های ارتباطی</h2></div>
      <div className={styles.sectionContent}>
        <div className={styles.dark}>
          <p>شماره پشتیبانی، ایمیل یا فرم تیکت و در صورت تصمیم کسب‌وکار، پیام‌رسان یا چت آنلاین در مرحله Integrations به این صفحه اضافه می‌شوند.</p>
          <p>تا قبل از آن، عمداً اطلاعات ساختگی یا کانال موقت نمایش نمی‌دهیم تا هر مسیری که مشتری می‌بیند همان کانال رسمی نهایی باشد.</p>
        </div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>BE READY</span><h2>برای بررسی سریع‌تر</h2></div>
      <div className={styles.grid3}>
        <article className={styles.card}><span>01</span><h3>شماره سفارش</h3><p>برای موضوعات مربوط به خرید، شماره سفارش مسیر بررسی را کوتاه‌تر می‌کند.</p></article>
        <article className={styles.card}><span>02</span><h3>موبایل سفارش</h3><p>همان شماره‌ای که هنگام Checkout ثبت شده برای تطبیق سفارش استفاده می‌شود.</p></article>
        <article className={styles.card}><span>03</span><h3>موضوع دقیق</h3><p>مثلاً پرداخت، فاکتور، ارسال، محصول یا درخواست پس از خرید.</p></article>
      </div>
    </section>
  </InfoShell>;
}
