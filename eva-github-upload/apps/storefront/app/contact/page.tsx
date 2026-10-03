import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function ContactPage(){
  return <InfoShell eyebrow="CONTACT EVA" title="برای هر سوال، مسیر درستش." lead="بخش تماس را از الان به‌صورت کامل در پوسته سایت می‌سازیم؛ کانال‌های واقعی پشتیبانی مثل تلفن، پیام‌رسان یا تیکت در مرحله اتصال سرویس‌ها فعال می‌شوند.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>BEFORE CONTACTING</span><h2>شاید جواب همین حالا آماده باشد</h2></div>
      <div className={styles.linkGrid}>
        <a className={styles.linkCard} href="/track-order"><span>ORDER</span><h3>وضعیت سفارش</h3><p>برای وضعیت آماده‌سازی یا ارسال، مستقیم سفارش را رهگیری کن.</p><b>رهگیری ←</b></a>
        <a className={styles.linkCard} href="/faq"><span>QUESTIONS</span><h3>سوال عمومی</h3><p>قیمت، وزن، خرید، فاکتور، هدیه و حساب کاربری.</p><b>FAQ ←</b></a>
        <a className={styles.linkCard} href="/shipping-returns"><span>AFTER SALES</span><h3>ارسال و مرجوعی</h3><p>روند ارسال و چارچوب فعلی درخواست‌های پس از خرید.</p><b>راهنما ←</b></a>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>SUPPORT CHANNELS</span><h2>کانال‌های ارتباطی</h2></div>
      <div className={styles.sectionContent}>
        <div className={styles.dark}>
          <p>در مرحله نهایی Integrations، کانال‌های رسمی EVA اینجا فعال می‌شوند: شماره پشتیبانی، ایمیل یا فرم تیکت، و در صورت تصمیم کسب‌وکار، پیام‌رسان یا چت آنلاین.</p>
          <p>فعلاً عمداً اطلاعات ساختگی یا کانال موقت روی سایت قرار نداده‌ایم تا چیزی که مشتری می‌بیند دقیقاً همان مسیر رسمی نهایی باشد.</p>
        </div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>WHEN CONTACTING EVA</span><h2>چه اطلاعاتی آماده داشته باشی؟</h2></div>
      <div className={styles.grid3}>
        <article className={styles.card}><span>01</span><h3>شماره سفارش</h3><p>برای موضوعات مربوط به خرید، شماره سفارش بررسی را سریع‌تر می‌کند.</p></article>
        <article className={styles.card}><span>02</span><h3>موبایل سفارش</h3><p>همان موبایلی که هنگام Checkout وارد شده برای تطبیق سفارش استفاده می‌شود.</p></article>
        <article className={styles.card}><span>03</span><h3>موضوع دقیق</h3><p>مثلاً پرداخت، فاکتور، ارسال، محصول یا درخواست پس از خرید.</p></article>
      </div>
    </section>
  </InfoShell>;
}
