import styles from './performance-state.module.css';

export default function Loading(){
  return <div className={styles.loadingOverlay} role="status" aria-live="polite" aria-busy="true">
    <span className={styles.srOnly}>در حال بارگذاری صفحه</span>
    <div className={styles.loaderMark} aria-hidden="true">
      <div className={styles.loaderHalo}/>
      <div className={styles.loaderLogo}>EVA</div>
      <div className={styles.loaderShimmer}/>
    </div>
  </div>;
}
