'use client';

import { useEffect } from 'react';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return <main className="loginPage">
    <section className="loginCard">
      <div className="loginBrand">EVA <span>ADMIN</span></div>
      <span className="eyebrow">SYSTEM ERROR</span>
      <h1>بارگذاری پنل کامل نشد.</h1>
      <p>اتصال یا یکی از سرویس‌های پنل موقتاً در دسترس نیست.</p>
      <button className="primaryButton" onClick={reset}>تلاش دوباره</button>
      <a href="/">بازگشت به داشبورد</a>
    </section>
  </main>;
}
