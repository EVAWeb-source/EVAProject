import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function PrivacyPage(){
  return <InfoShell eyebrow="PRIVACY" title="حریم خصوصی در EVA" lead="ایوا فقط اطلاعاتی را نگه می‌دارد که برای ارائه فروشگاه، ثبت و پیگیری سفارش، امنیت حساب و بهبود تجربه کاربری لازم است. این صفحه بر اساس قابلیت‌های فعلی پلتفرم تهیه شده است.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>DATA WE USE</span><h2>چه اطلاعاتی پردازش می‌شود؟</h2></div>
      <div className={styles.sectionContent}>
        <p>هنگام خرید ممکن است نام، شماره موبایل، نام گیرنده، استان، شهر، نشانی، کدپستی و اطلاعات خود سفارش ثبت شود. برای حساب My EVA، شماره موبایل، چالش OTP و Session امن استفاده می‌شود.</p>
        <p>برای عملکرد فروشگاه، سبد خرید و علاقه‌مندی‌ها در مرورگر همان دستگاه ذخیره می‌شوند. همچنین رویدادهای پایه‌ای مانند مسیر صفحه و Referrer برای تحلیل عملکرد سایت ثبت می‌شوند.</p>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>SECURITY</span><h2>امنیت و دسترسی</h2></div>
      <div className={styles.grid2}>
        <article className={styles.card}><span>ACCOUNT</span><h3>Session حساب</h3><p>Session حساب مشتری به‌صورت توکن امن مدیریت می‌شود و نسخه ذخیره‌شده در پایگاه داده به شکل Hash نگهداری می‌شود.</p></article>
        <article className={styles.card}><span>INVOICE</span><h3>اطلاعات فاکتور</h3><p>نسخه کامل فاکتور حاوی اطلاعات خصوصی است و فقط از مسیرهای مجاز حساب یا دسترسی خصوصی همان پرداخت نمایش داده می‌شود. صفحه Verify عمومی، اطلاعات خصوصی مشتری را نمایش نمی‌دهد.</p></article>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>BROWSER STORAGE</span><h2>ذخیره‌سازی در مرورگر</h2></div>
      <div className={styles.sectionContent}>
        <p>سبد خرید، Wishlist، وضعیت هدیه و برخی اطلاعات موقت جریان سفارش ممکن است در Local Storage یا Session Storage مرورگر ذخیره شوند تا تجربه خرید پایدار بماند.</p>
        <p>پاک‌کردن داده‌های مرورگر می‌تواند این اطلاعات محلی را حذف کند، اما سفارش‌هایی که در سیستم ثبت شده‌اند از طریق رهگیری یا My EVA قابل مشاهده خواهند بود.</p>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>THIRD PARTIES</span><h2>سرویس‌های بیرونی</h2></div>
      <div className={styles.sectionContent}>
        <p>درگاه پرداخت، پیامک و سرویس ارسال هنوز به نسخه Production متصل نشده‌اند. هنگام اتصال هر سرویس، فقط داده موردنیاز همان خدمت ارسال می‌شود و این صفحه متناسب با Providerهای نهایی به‌روزرسانی خواهد شد.</p>
        <div className={styles.notice}>پیش از شروع فروش واقعی، نام حقوقی فروشنده، راه ارتباط رسمی و جزئیات Providerهای نهایی نیز به این سیاست اضافه می‌شوند.</div>
      </div>
    </section>
  </InfoShell>;
}