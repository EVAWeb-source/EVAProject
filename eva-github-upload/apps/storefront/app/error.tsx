'use client';

import { useEffect } from 'react';
import styles from './performance-state.module.css';

export default function ErrorState({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error(error);},[error]);
  return <main className={styles.state}>
    <section className={styles.card}>
      <span className={styles.eyebrow}>EVA • CONNECTION</span>
      <h1>دریافت اطلاعات کامل نشد.</h1>
      <p>ممکن است ارتباط با سرویس فروشگاه لحظه‌ای قطع شده باشد. دوباره تلاش کن؛ سبد خرید و علاقه‌مندی‌های مرورگر حذف نمی‌شوند.</p>
      <div className={styles.actions}><button onClick={reset}>تلاش دوباره</button><a href="/">بازگشت به خانه</a></div>
    </section>
  </main>;
}
