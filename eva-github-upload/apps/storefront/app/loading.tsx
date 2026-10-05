import styles from './performance-state.module.css';

export default function Loading(){
  return <main className={styles.state} aria-live="polite" aria-busy="true">
    <section className={styles.card}>
      <div className={styles.pulse} aria-hidden="true"/>
      <span className={styles.eyebrow}>EVA</span>
      <h1>در حال آماده‌سازی...</h1>
      <p>اطلاعات تازه محصول، موجودی و قیمت در حال دریافت است.</p>
    </section>
  </main>;
}
