import type { ReactNode } from 'react';
import Link from 'next/link';
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
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{lead}</p>
      </div>

      <aside className={styles.trustRail} aria-label="شفافیت خرید در ایوا">
        <div><i>01</i><span>وزن هر قطعه</span><strong>دقیق و مستقل</strong></div>
        <div><i>02</i><span>قیمت و فاکتور</span><strong>قابل بررسی</strong></div>
        <div><i>03</i><span>وضعیت سفارش</span><strong>قابل رهگیری</strong></div>
      </aside>
    </section>

    <nav className={styles.serviceNav} aria-label="راهنمای ایوا">
      <Link href="/trust"><span>TRUST</span><strong>اعتماد و شفافیت</strong></Link>
      <Link href="/faq"><span>FAQ</span><strong>سوالات متداول</strong></Link>
      <Link href="/shipping-returns"><span>SERVICE</span><strong>ارسال و مرجوعی</strong></Link>
      <Link href="/track-order"><span>TRACK</span><strong>رهگیری سفارش</strong></Link>
    </nav>

    <div className={styles.body}>{children}</div>
  </main>;
}
