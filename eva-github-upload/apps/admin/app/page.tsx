import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminActions from './components/AdminActions';
import { ADMIN_SESSION_COOKIE, sessionValue } from './lib/admin-auth';

export const dynamic = 'force-dynamic';

type Dashboard = {
  generatedAt: string;
  summary: {
    activeProducts: number;
    units: { available: number; reserved: number; sold: number; total: number };
    orders: { paid: number; pending: number; cancelled: number };
    invoices: number;
    paidRevenueToman: number;
  };
  collections: Array<{ id: string; nameFa: string; slug: string; code: string }>;
  pricing: {
    rate: null | { purity: number; tomanPerGram: number; source: string; rateVersion: string; observedAt: string };
    rule: null | { id: string; name: string; formulaVersion: string; makingPercent: number; profitPercent: number; taxPercent: number; updatedAt: string };
  };
  products: Array<{
    id: string;
    nameFa: string;
    slug: string;
    masterSku: string;
    purity: number;
    status: string;
    collectionId: string | null;
    collection: string | null;
    unitCount: number;
    availableCount: number;
  }>;
  units: Array<{
    id: string;
    productId: string;
    unitSku: string;
    productNameFa: string;
    exactWeightGram: string;
    currentPriceToman: number | null;
    status: string;
    reservedUntil: string | null;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    customerName: string;
    mobile: string;
    city: string;
    totalToman: number;
    createdAt: string;
    item: null | { productNameFa: string; unitSku: string; exactWeightGram: string };
    payment: null | { provider: string; status: string; referenceId: string | null; paidAt: string | null };
    invoiceNumber: string | null;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    customerName: string;
    customerMobile: string;
    totalToman: number;
    verificationCode: string;
    issuedAt: string;
    item: null | { productNameFa: string; unitSku: string };
  }>;
};

const sections = [
  ['#dashboard', 'داشبورد'],
  ['#management', 'مدیریت محصول و Unit'],
  ['#products', 'محصولات'],
  ['#inventory', 'Unit و موجودی'],
  ['#orders', 'سفارش‌ها'],
  ['#invoices', 'فاکتورها'],
  ['#pricing', 'قیمت‌گذاری'],
];

function toman(value: number) {
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
}

function faNumber(value: number | string) {
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 3 }).format(Number(value));
}

function date(value: string) {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function statusFa(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: 'فعال', DRAFT: 'پیش‌نویس', OUT_OF_STOCK: 'ناموجود', HIDDEN: 'مخفی',
    DISCONTINUED: 'توقف عرضه', ARCHIVED: 'آرشیو', AVAILABLE: 'موجود', RESERVED: 'رزرو',
    SOLD: 'فروخته‌شده', QC_PENDING: 'در انتظار QC', QUALITY_HOLD: 'توقف QC',
    DAMAGED: 'آسیب‌دیده', UNAVAILABLE: 'غیرقابل فروش', PAID: 'پرداخت‌شده',
    PENDING_PAYMENT: 'در انتظار پرداخت', CANCELLED: 'لغوشده', ISSUED: 'صادرشده',
    SUCCEEDED: 'موفق', FAILED: 'ناموفق',
  };
  return labels[status] ?? status;
}

async function loadDashboard(): Promise<{ data: Dashboard | null; error: string | null }> {
  const apiBase = process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) return { data: null, error: 'ADMIN_API_KEY برای سرویس پنل تنظیم نشده است.' };

  try {
    const response = await fetch(`${apiBase}/api/v1/admin/dashboard`, {
      cache: 'no-store',
      headers: { 'x-admin-key': adminKey },
    });
    if (!response.ok) {
      return { data: null, error: `API پنل پاسخ ${response.status} داد. کلید مدیریت دو سرویس را بررسی کن.` };
    }
    return { data: await response.json(), error: null };
  } catch {
    return { data: null, error: 'اتصال پنل به EVA-API برقرار نشد.' };
  }
}

export default async function AdminPage() {
  const expectedSession = sessionValue();
  const cookieStore = await cookies();
  if (expectedSession && cookieStore.get(ADMIN_SESSION_COOKIE)?.value !== expectedSession) redirect('/login');

  const { data, error } = await loadDashboard();

  return (
    <main className="adminShell">
      <aside className="sidebar">
        <div className="logo">EVA <span>ADMIN</span></div>
        <nav>{sections.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
        <form action="/api/logout" method="post"><button className="logoutButton">خروج امن</button></form>
        <div className="sidebarNote">نسخه مدیریتی آزمایشی<br />EVA Commerce Core</div>
      </aside>

      <section className="content">
        <div className="topline">
          <div><strong>مرکز عملیات EVA</strong><span>Commerce Administration</span></div>
          <span className={error ? 'status danger' : 'status'}>{error ? 'نیاز به تنظیم' : 'متصل به دیتابیس'}</span>
        </div>

        {error || !data ? (
          <section className="setupCard"><span>ADMIN CONNECTION</span><h1>پنل آماده اتصال است.</h1><p>{error}</p></section>
        ) : (
          <>
            <section id="dashboard" className="hero">
              <div><span className="eyebrow">LIVE OPERATIONS</span><h1>داشبورد EVA</h1><p>تصویر لحظه‌ای از محصول، موجودی، فروش، فاکتور و موتور قیمت‌گذاری.</p></div>
              <small>آخرین بروزرسانی: {date(data.generatedAt)}</small>
            </section>

            <section className="metrics">
              <article><span>محصول فعال</span><b>{faNumber(data.summary.activeProducts)}</b><small>Master Product</small></article>
              <article><span>Unit موجود</span><b>{faNumber(data.summary.units.available)}</b><small>از {faNumber(data.summary.units.total)} قطعه</small></article>
              <article><span>Unit فروخته‌شده</span><b>{faNumber(data.summary.units.sold)}</b><small>{faNumber(data.summary.units.reserved)} رزرو فعال</small></article>
              <article><span>سفارش پرداخت‌شده</span><b>{faNumber(data.summary.orders.paid)}</b><small>{faNumber(data.summary.orders.pending)} در انتظار پرداخت</small></article>
              <article><span>فاکتور صادرشده</span><b>{faNumber(data.summary.invoices)}</b><small>Invoice Snapshot</small></article>
              <article className="metricWide"><span>فروش ثبت‌شده آزمایشی</span><b>{toman(data.summary.paidRevenueToman)}</b><small>جمع سفارش‌های PAID فعلی</small></article>
            </section>

            <AdminActions
              collections={data.collections}
              products={data.products.map(({ id, nameFa, masterSku, status, collectionId }) => ({ id, nameFa, masterSku, status, collectionId }))}
              units={data.units.map(({ id, productId, unitSku, productNameFa, exactWeightGram, status }) => ({ id, productId, unitSku, productNameFa, exactWeightGram, status }))}
            />

            <section id="products" className="panel">
              <div className="panelHead"><div><span>CATALOG</span><h2>محصولات</h2></div><small>{faNumber(data.products.length)} محصول در دیتابیس</small></div>
              <div className="tableWrap"><table><thead><tr><th>محصول</th><th>کالکشن</th><th>Master SKU</th><th>عیار</th><th>Unit</th><th>موجود</th><th>وضعیت</th></tr></thead><tbody>
                {data.products.map(product => <tr key={product.id}><td><strong>{product.nameFa}</strong><small>/{product.slug}</small></td><td>{product.collection ?? '—'}</td><td dir="ltr">{product.masterSku}</td><td>{faNumber(product.purity)}</td><td>{faNumber(product.unitCount)}</td><td>{faNumber(product.availableCount)}</td><td><span className={`badge ${product.status.toLowerCase()}`}>{statusFa(product.status)}</span></td></tr>)}
              </tbody></table></div>
            </section>

            <section id="inventory" className="panel">
              <div className="panelHead"><div><span>PHYSICAL INVENTORY</span><h2>Unit و موجودی</h2></div><small>هر ردیف یک قطعه واقعی است</small></div>
              <div className="tableWrap"><table><thead><tr><th>محصول</th><th>Unit SKU</th><th>وزن دقیق</th><th>قیمت فعلی</th><th>وضعیت</th><th>رزرو تا</th></tr></thead><tbody>
                {data.units.map(unit => <tr key={unit.id}><td><strong>{unit.productNameFa}</strong></td><td dir="ltr">{unit.unitSku}</td><td>{faNumber(unit.exactWeightGram)} گرم</td><td>{unit.currentPriceToman === null ? '—' : toman(unit.currentPriceToman)}</td><td><span className={`badge ${unit.status.toLowerCase()}`}>{statusFa(unit.status)}</span></td><td>{unit.reservedUntil ? date(unit.reservedUntil) : '—'}</td></tr>)}
              </tbody></table></div>
            </section>

            <section id="orders" className="panel">
              <div className="panelHead"><div><span>COMMERCE</span><h2>آخرین سفارش‌ها</h2></div><small>حداکثر ۳۰ سفارش اخیر</small></div>
              <div className="tableWrap"><table><thead><tr><th>شماره سفارش</th><th>مشتری</th><th>محصول</th><th>مبلغ</th><th>پرداخت</th><th>فاکتور</th><th>تاریخ</th></tr></thead><tbody>
                {data.orders.map(order => <tr key={order.id}><td><strong dir="ltr">{order.orderNumber}</strong><small>{statusFa(order.status)}</small></td><td><strong>{order.customerName}</strong><small dir="ltr">{order.mobile}</small></td><td>{order.item ? <><strong>{order.item.productNameFa}</strong><small>{faNumber(order.item.exactWeightGram)} گرم</small></> : '—'}</td><td>{toman(order.totalToman)}</td><td><span className={`badge ${(order.payment?.status ?? order.status).toLowerCase()}`}>{statusFa(order.payment?.status ?? order.status)}</span></td><td>{order.invoiceNumber ? <span dir="ltr">{order.invoiceNumber}</span> : '—'}</td><td>{date(order.createdAt)}</td></tr>)}
              </tbody></table></div>
            </section>

            <section id="invoices" className="panel">
              <div className="panelHead"><div><span>FINANCE</span><h2>فاکتورها</h2></div><small>Snapshot مستقل از سفارش</small></div>
              <div className="tableWrap"><table><thead><tr><th>شماره فاکتور</th><th>مشتری</th><th>محصول</th><th>مبلغ</th><th>وضعیت</th><th>صدور</th></tr></thead><tbody>
                {data.invoices.map(invoice => <tr key={invoice.id}><td><strong dir="ltr">{invoice.invoiceNumber}</strong></td><td><strong>{invoice.customerName}</strong><small dir="ltr">{invoice.customerMobile}</small></td><td>{invoice.item?.productNameFa ?? '—'}</td><td>{toman(invoice.totalToman)}</td><td><span className={`badge ${invoice.status.toLowerCase()}`}>{statusFa(invoice.status)}</span></td><td>{date(invoice.issuedAt)}</td></tr>)}
              </tbody></table></div>
            </section>

            <section id="pricing" className="panel pricingPanel">
              <div className="panelHead"><div><span>PRICING ENGINE</span><h2>قیمت‌گذاری</h2></div><small>فعلاً فرمول Demo قابل تعویض است</small></div>
              <div className="pricingGrid">
                <article><span>نرخ طلای {data.pricing.rate?.purity ?? 18} عیار / گرم</span><strong>{data.pricing.rate ? toman(data.pricing.rate.tomanPerGram) : '—'}</strong><small>{data.pricing.rate?.rateVersion ?? 'بدون نرخ'}</small></article>
                <article><span>اجرت</span><strong>{data.pricing.rule ? `${faNumber(data.pricing.rule.makingPercent)}٪` : '—'}</strong><small>{data.pricing.rule?.formulaVersion ?? '—'}</small></article>
                <article><span>سود</span><strong>{data.pricing.rule ? `${faNumber(data.pricing.rule.profitPercent)}٪` : '—'}</strong><small>{data.pricing.rule?.name ?? '—'}</small></article>
                <article><span>مالیات</span><strong>{data.pricing.rule ? `${faNumber(data.pricing.rule.taxPercent)}٪` : '—'}</strong><small>قانون موقت تست</small></article>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
