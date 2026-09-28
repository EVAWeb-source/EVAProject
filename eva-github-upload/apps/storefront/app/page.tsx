const principles = [
  ['قیمت شفاف', 'وزن، عیار و جزئیات قیمت همیشه روشن و قابل‌فهم است.'],
  ['فاکتور معتبر', 'هر خرید به فاکتور و مسیر قابل‌پیگیری خودش متصل می‌شود.'],
  ['قطعه واقعی', 'هر قطعه طلا موجودی و وزن دقیق مستقل خودش را دارد.'],
];

export default function HomePage() {
  return (
    <main>
      <header className="siteHeader">
        <div className="brand">EVA</div>
        <nav aria-label="ناوبری اصلی">
          <a href="#shop">فروشگاه</a>
          <a href="#collection">کالکشن‌ها</a>
          <a href="#gift">هدیه</a>
          <a href="#light">طلای سبک</a>
        </nav>
        <button className="iconButton" aria-label="سبد خرید">۰</button>
      </header>

      <section className="hero">
        <div className="eyebrow">EVA GOLD BOUTIQUE</div>
        <h1>طلایی که با تو معنا می‌گیرد.</h1>
        <p>
          نسخه اولیه فنی فروشگاه EVA راه‌اندازی شده؛ از این نقطه هسته واقعی محصول، قیمت‌گذاری،
          موجودی و خرید را مرحله‌به‌مرحله روی همین پروژه می‌سازیم.
        </p>
        <div className="actions">
          <a className="primaryButton" href="#shop">مشاهده فروشگاه</a>
          <a className="textLink" href="#architecture">معماری نسخه فعلی</a>
        </div>
      </section>

      <section className="section" id="shop">
        <div className="sectionHeading">
          <span>FOUNDATION</span>
          <h2>هسته‌ای برای فروش واقعی طلا</h2>
        </div>
        <div className="cards">
          {principles.map(([title, body]) => (
            <article className="card" key={title}>
              <div className="diamond" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="architecture" id="architecture">
        <div>
          <span className="eyebrow">TECHNICAL FOUNDATION</span>
          <h2>Storefront + Admin + API</h2>
        </div>
        <div className="architectureGrid">
          <div><b>Storefront</b><span>Next.js 16</span></div>
          <div><b>Admin</b><span>Next.js 16</span></div>
          <div><b>API</b><span>NestJS 12</span></div>
          <div><b>Data</b><span>PostgreSQL + Prisma</span></div>
        </div>
      </section>
    </main>
  );
}
