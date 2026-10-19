import Link from 'next/link';

export default function AdminNotFound() {
  return <main className="loginPage">
    <section className="loginCard">
      <div className="loginBrand">EVA <span>ADMIN</span></div>
      <span className="eyebrow">404</span>
      <h1>این بخش پیدا نشد.</h1>
      <p>آدرس پنل معتبر نیست یا این بخش جابه‌جا شده است.</p>
      <Link className="primaryButton" href="/">بازگشت به داشبورد</Link>
    </section>
  </main>;
}
