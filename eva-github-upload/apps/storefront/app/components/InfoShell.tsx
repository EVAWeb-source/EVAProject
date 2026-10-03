import type { ReactNode } from 'react';
import styles from './InfoShell.module.css';

export default function InfoShell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return <main className={styles.page}>
    <div className={styles.announcement}>ارسال امن • فاکتور معتبر • قیمت شفاف</div>
    <header className={styles.header}>
      <a className={styles.brand} href="/">EVA</a>
      <nav>
        <a href="/shop">فروشگاه</a>
        <a href="/collections">کالکشن‌ها</a>
        <a href="/gift">هدیه</a>
        <a href="/lightweight">طلای سبک</a>
        <a href="/about">درباره ایوا</a>
        <a href="/help">راهنما</a>
      </nav>
      <div className={styles.actions}>
        <a href="/wishlist">♡</a>
        <a href="/account">حساب</a>
        <a className={styles.cart} href="/cart">سبد</a>
      </div>
    </header>

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{lead}</p>
      </div>
      <div className={styles.heroArt} aria-hidden="true">
        <div className={styles.orbit}/>
        <span className={styles.line}/>
        <i className={styles.point}/>
      </div>
    </section>

    <div className={styles.body}>{children}</div>

    <footer className={styles.footer}>
      <div className={styles.footerBrand}><a className={styles.brand} href="/">EVA</a><p>بوتیک آنلاین طلای معاصر؛ طراحی ظریف و خرید شفاف.</p></div>
      <div className={styles.footerLinks}>
        <div><strong>خرید</strong><a href="/shop">فروشگاه</a><a href="/collections">کالکشن‌ها</a><a href="/gift">هدیه</a><a href="/lightweight">طلای سبک</a></div>
        <div><strong>اعتماد و راهنما</strong><a href="/trust">اعتماد به EVA</a><a href="/faq">سوالات متداول</a><a href="/shipping-returns">ارسال و مرجوعی</a><a href="/track-order">رهگیری سفارش</a></div>
        <div><strong>EVA</strong><a href="/about">درباره ما</a><a href="/contact">تماس</a><a href="/help">مرکز راهنما</a></div>
      </div>
    </footer>
  </main>;
}
