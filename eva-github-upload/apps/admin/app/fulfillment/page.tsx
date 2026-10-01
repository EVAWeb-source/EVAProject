import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FulfillmentClient from './FulfillmentClient';
import styles from './fulfillment.module.css';
import { ADMIN_SESSION_COOKIE, sessionValue } from '../lib/admin-auth';

export const dynamic = 'force-dynamic';

const apiBase = process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
const storefrontBase = process.env.STOREFRONT_URL ?? 'https://evaproject-production.up.railway.app';

type FulfillmentStatus = 'REGISTERED' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED';

type FulfillmentData = {
  generatedAt: string;
  summary: Record<FulfillmentStatus, number>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    fulfillmentStatus: FulfillmentStatus;
    customerName: string;
    mobile: string;
    recipientName: string;
    province: string;
    city: string;
    address: string;
    postalCode: string;
    shippingCarrier: string | null;
    trackingCode: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    totalToman: number;
    createdAt: string;
    item: null | { productNameFa: string; unitSku: string; exactWeightGram: string };
    payment: null | { referenceId: string | null; paidAt: string | null };
    invoiceNumber: string | null;
  }>;
};

const fa = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

async function loadFulfillment(): Promise<{ data: FulfillmentData | null; error: string | null }> {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return { data: null, error: 'ADMIN_API_KEY تنظیم نشده است.' };
  try {
    const response = await fetch(`${apiBase}/api/v1/admin/fulfillment`, {
      cache: 'no-store',
      headers: { 'x-admin-key': adminKey },
    });
    if (!response.ok) return { data: null, error: `API پاسخ ${response.status} داد.` };
    return { data: await response.json(), error: null };
  } catch {
    return { data: null, error: 'اتصال به EVA-API برقرار نشد.' };
  }
}

export default async function FulfillmentPage() {
  const expectedSession = sessionValue();
  const cookieStore = await cookies();
  if (expectedSession && cookieStore.get(ADMIN_SESSION_COOKIE)?.value !== expectedSession) redirect('/login');

  const { data, error } = await loadFulfillment();

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>EVA <span>ADMIN</span></div>
        <nav className={styles.nav}>
          <a href="/">داشبورد</a>
          <a href="/fulfillment">آماده‌سازی و ارسال</a>
          <a href="/#orders">سفارش‌ها</a>
          <a href="/#invoices">فاکتورها</a>
        </nav>
        <div className={styles.sideNote}>Fulfillment Operations<br />EVA Commerce Core</div>
      </aside>

      <section className={styles.content}>
        <header className={styles.top}>
          <div>
            <span className={styles.eyebrow}>FULFILLMENT OPERATIONS</span>
            <h1>آماده‌سازی و ارسال سفارش‌ها</h1>
            <p>مدیریت مرحله‌به‌مرحله سفارش‌های پرداخت‌شده تا تحویل نهایی.</p>
          </div>
          <a href="/">بازگشت به داشبورد</a>
        </header>

        {error || !data ? (
          <div className={`${styles.notice} ${styles.noticeError}`}>{error ?? 'اطلاعات قابل دریافت نیست.'}</div>
        ) : (
          <>
            <section className={styles.summary}>
              <article><span>ثبت‌شده</span><b>{fa(data.summary.REGISTERED ?? 0)}</b></article>
              <article><span>در حال آماده‌سازی</span><b>{fa(data.summary.PREPARING ?? 0)}</b></article>
              <article><span>آماده ارسال</span><b>{fa(data.summary.READY_TO_SHIP ?? 0)}</b></article>
              <article><span>ارسال‌شده</span><b>{fa(data.summary.SHIPPED ?? 0)}</b></article>
              <article><span>تحویل‌شده</span><b>{fa(data.summary.DELIVERED ?? 0)}</b></article>
            </section>
            <FulfillmentClient orders={data.orders} storefrontBase={storefrontBase} />
          </>
        )}
      </section>
    </main>
  );
}
