import Link from 'next/link';
import styles from './performance-state.module.css';

export default function NotFound() {
  return <main className={styles.state}>
    <section className={styles.card}>
      <span className={styles.eyebrow}>EVA • 404</span>
      <h1>این صفحه پیدا نشد.</h1>
      <p>ممکن است آدرس تغییر کرده باشد یا صفحه دیگر در دسترس نباشد.</p>
      <div className={styles.actions}>
        <Link href="/">بازگشت به خانه</Link>
        <Link href="/shop">مشاهده فروشگاه</Link>
      </div>
    </section>
  </main>;
}
