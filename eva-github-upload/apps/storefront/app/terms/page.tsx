import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function TermsPage(){
  return <InfoShell eyebrow="TERMS" title="شرایط استفاده و خرید از EVA" lead="این صفحه چارچوب فعلی استفاده از فروشگاه و جریان سفارش ایوا را توضیح می‌دهد. موارد وابسته به درگاه، ارسال و سیاست تجاری نهایی پیش از شروع فروش واقعی تکمیل می‌شوند.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>PRODUCT & PRICE</span><h2>محصول، وزن و قیمت</h2></div>
      <div className={styles.sectionContent}>
        <p>هر Unit فیزیکی می‌تواند وزن و قیمت مستقل داشته باشد. مشتری پیش از ادامه خرید، Unit انتخاب‌شده، وزن، عیار و قیمت همان قطعه را مشاهده می‌کند.</p>
        <p>در Checkout، قطعه برای مدت محدود رزرو می‌شود تا هم‌زمان به مشتری دیگری فروخته نشود. با پایان زمان رزرو، موجودی می‌تواند دوباره آزاد شود.</p>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>ORDER</span><h2>ثبت سفارش</h2></div>
      <div className={styles.sectionContent}>
        <p>برای ثبت سفارش، اطلاعات تماس و ارسال باید صحیح و متعلق به سفارش باشد. مسئولیت بررسی صحت نام گیرنده، شماره موبایل و نشانی پیش از ادامه با کاربر است.</p>
        <p>در نسخه فعلی، پرداخت Demo است و هیچ مبلغ بانکی واقعی دریافت نمی‌شود. فروش واقعی فقط پس از اتصال درگاه رسمی و فعال‌شدن جریان پرداخت Production آغاز خواهد شد.</p>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>FULFILLMENT</span><h2>ارسال، لغو و مرجوعی</h2></div>
      <div className={styles.sectionContent}>
        <p>وضعیت سفارش از ثبت تا آماده‌سازی، ارسال و تحویل قابل رهگیری است. روش، هزینه و بازه نهایی ارسال پس از انتخاب Provider لجستیک در Checkout نمایش داده خواهد شد.</p>
        <p>شرایط نهایی لغو و مرجوعی، از جمله بازه زمانی و شرایط بررسی کیفی، قبل از فروش عمومی در صفحه «ارسال و مرجوعی» نهایی خواهد شد.</p>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>ACCOUNT & SECURITY</span><h2>حساب و استفاده مجاز</h2></div>
      <div className={styles.sectionContent}>
        <p>کاربر نباید برای دسترسی به سفارش، حساب یا اطلاعات شخص دیگر تلاش کند. مسیرهای خصوصی سفارش و فاکتور با شماره موبایل، Session یا Token مجاز محافظت می‌شوند.</p>
        <p>استفاده مخرب، تلاش برای دورزدن محدودیت موجودی یا رزرو، و ایجاد بار غیرعادی روی سرویس می‌تواند باعث محدودشدن دسترسی شود.</p>
        <div className={styles.notice}>این نسخه، ساختار پیش‌لانچ شرایط استفاده است. اطلاعات حقوقی فروشنده و سیاست‌های تجاری نهایی باید پیش از فعال‌شدن فروش واقعی تکمیل شوند.</div>
      </div>
    </section>
  </InfoShell>;
}