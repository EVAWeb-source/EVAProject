const modules = ['محصولات', 'واحدهای فیزیکی', 'موجودی و QC', 'قیمت‌گذاری', 'سفارش‌ها', 'فاکتورها'];

export default function AdminPage() {
  return (
    <main className="adminShell">
      <aside>
        <div className="logo">EVA <span>ADMIN</span></div>
        <nav>{modules.map((item) => <a key={item} href="#">{item}</a>)}</nav>
      </aside>
      <section className="content">
        <div className="topline"><span>داشبورد</span><span className="status">Foundation Ready</span></div>
        <h1>مرکز عملیات EVA</h1>
        <p>در گام‌های بعدی مدیریت محصول، Physical Unit، QC، قیمت و سفارش‌ها روی همین پنل پیاده می‌شود.</p>
        <div className="metrics">
          <article><b>۰</b><span>محصول فعال</span></article>
          <article><b>۰</b><span>Unit موجود</span></article>
          <article><b>—</b><span>نرخ طلا</span></article>
        </div>
      </section>
    </main>
  );
}
