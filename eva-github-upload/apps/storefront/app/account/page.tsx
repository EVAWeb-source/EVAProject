import { cookies } from 'next/headers';
import Link from 'next/link';
import LoginClient from './LoginClient';
import LogoutButton from './LogoutButton';
import styles from './account.module.css';

const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';
const COOKIE_NAME = 'eva_customer_session';

type OrderItem = {
  name: string;
  masterSku: string;
  unitSku: string;
  weightGram: string;
  purity: number;
  priceToman: number;
};

type Order = {
  number: string;
  status: string;
  fulfillmentStatus: 'REGISTERED' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED';
  customerName: string;
  recipientName: string;
  city: string;
  province: string;
  address: string;
  postalCode: string;
  isGift: boolean;
  giftMessage: string | null;
  hidePriceInPackage: boolean;
  shippingCarrier: string | null;
  trackingCode: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  totalToman: number;
  createdAt: string;
  invoice: { invoiceNumber: string; verificationCode: string } | null;
  payment: { status: string; provider: string; referenceId: string | null; paidAt: string | null } | null;
  items: OrderItem[];
  item: OrderItem | null;
};

const flow = ['REGISTERED', 'PREPARING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'] as const;
const labels: Record<(typeof flow)[number], string> = {
  REGISTERED: 'ثبت شد',
  PREPARING: 'در حال آماده‌سازی',
  READY_TO_SHIP: 'آماده ارسال',
  SHIPPED: 'ارسال شد',
  DELIVERED: 'تحویل شد',
};

const orderStatusLabels: Record<string, string> = {
  DEMO_CONFIRMED: 'تأیید آزمایشی',
  PAID: 'پرداخت‌شده',
  PENDING_PAYMENT: 'در انتظار پرداخت',
  CANCELLED: 'لغوشده',
  REFUND_PENDING: 'در انتظار بازپرداخت',
  REFUNDED: 'بازپرداخت‌شده',
};

function toman(value: number) {
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
}

function date(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function weight(value: string) {
  return `${new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(Number(value))} گرم`;
}

function maskMobile(value: string) {
  if (value.length < 8) return value;
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  let orders: Order[] | null = null;
  let mobile = '';
  let expired = false;

  if (token) {
    try {
      const response = await fetch(`${apiBase}/api/v1/customer/orders`, {
        headers: { authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        orders = data.orders ?? [];
        mobile = data.mobile ?? '';
      } else if (response.status === 401) {
        expired = true;
      }
    } catch {}
  }

  if (orders === null) {
    return (
      <main className={styles.loginPage}>
        <div className={styles.loginLayout}>
          <section className={styles.loginIntro}>
            <span>MY EVA</span>
            <h1>حساب شخصی ایوا</h1>
            <p>سفارش‌ها، وضعیت ارسال و فاکتورهای خودت را با همان شماره موبایلی که هنگام خرید ثبت کرده‌ای دنبال کن.</p>
            <div className={styles.loginBenefits}>
              <div><b>01</b><span>مشاهده همه سفارش‌ها</span></div>
              <div><b>02</b><span>پیگیری وضعیت ارسال</span></div>
              <div><b>03</b><span>دسترسی به فاکتور و اصالت</span></div>
            </div>
          </section>
          <LoginClient expired={expired} />
        </div>
      </main>
    );
  }

  const paidCount = orders.filter((order) => order.status === 'PAID').length;
  const activeCount = orders.filter((order) => order.status === 'PAID' && order.fulfillmentStatus !== 'DELIVERED').length;
  const deliveredCount = orders.filter((order) => order.fulfillmentStatus === 'DELIVERED').length;

  return (
    <main className={styles.page}>
      <section className={styles.accountHero}>
        <div>
          <span className={styles.eyebrow}>MY EVA</span>
          <h1>حساب من</h1>
          <p>شماره متصل: <b dir="ltr">{maskMobile(mobile)}</b></p>
        </div>
        <LogoutButton />
      </section>

      <section className={styles.overview} aria-label="خلاصه حساب">
        <div><span>کل سفارش‌ها</span><strong>{new Intl.NumberFormat('fa-IR').format(orders.length)}</strong></div>
        <div><span>پرداخت‌شده</span><strong>{new Intl.NumberFormat('fa-IR').format(paidCount)}</strong></div>
        <div><span>در مسیر</span><strong>{new Intl.NumberFormat('fa-IR').format(activeCount)}</strong></div>
        <div><span>تحویل‌شده</span><strong>{new Intl.NumberFormat('fa-IR').format(deliveredCount)}</strong></div>
      </section>

      <nav className={styles.quickActions} aria-label="دسترسی سریع حساب">
        <Link href="/shop"><span>SHOP</span><strong>ادامه خرید</strong><i>←</i></Link>
        <Link href="/wishlist"><span>WISHLIST</span><strong>علاقه‌مندی‌ها</strong><i>←</i></Link>
        <Link href="/track-order"><span>TRACK</span><strong>رهگیری سفارش</strong><i>←</i></Link>
        <Link href="/help"><span>HELP</span><strong>راهنما و پشتیبانی</strong><i>←</i></Link>
      </nav>

      <section className={styles.ordersSection}>
        <div className={styles.sectionHead}>
          <div><span className={styles.eyebrow}>ORDERS</span><h2>سفارش‌های من</h2></div>
          <span>{new Intl.NumberFormat('fa-IR').format(orders.length)} سفارش</span>
        </div>

        <div className={styles.orders}>
          {orders.map((order) => {
            const current = flow.indexOf(order.fulfillmentStatus);
            const items = order.items?.length ? order.items : order.item ? [order.item] : [];
            const showProgress = order.status === 'PAID' || order.status === 'DEMO_CONFIRMED';
            const statusClass = order.status === 'PAID' ? styles.statusPaid : order.status === 'PENDING_PAYMENT' ? styles.statusPending : styles.statusMuted;

            return (
              <article className={styles.orderCard} key={order.number}>
                <header className={styles.orderHead}>
                  <div>
                    <span className={styles.orderDate}>{date(order.createdAt)}</span>
                    <h3 dir="ltr">{order.number}</h3>
                  </div>
                  <div className={styles.orderBadges}>
                    {order.isGift && <span className={styles.giftBadge}>هدیه</span>}
                    <span className={statusClass}>{orderStatusLabels[order.status] ?? order.status}</span>
                  </div>
                </header>

                {showProgress ? (
                  <div className={styles.progressWrap}>
                    <div className={styles.progress}>
                      {flow.map((step, index) => (
                        <div className={index <= current ? styles.stepDone : styles.step} key={step}>
                          <i>{index < current ? '✓' : index + 1}</i>
                          <span>{labels[step]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.stateNotice}>وضعیت فعلی سفارش: <strong>{orderStatusLabels[order.status] ?? order.status}</strong></div>
                )}

                <div className={styles.orderBody}>
                  <div className={styles.itemsBlock}>
                    <div className={styles.blockTitle}><span>قطعات سفارش</span><b>{new Intl.NumberFormat('fa-IR').format(items.length)} قطعه</b></div>
                    <div className={styles.orderItems}>
                      {items.map((item) => (
                        <div className={styles.orderItem} key={item.unitSku}>
                          <div><strong>{item.name}</strong><span>{weight(item.weightGram)} · {new Intl.NumberFormat('fa-IR').format(item.purity)} عیار</span></div>
                          <div><small dir="ltr">{item.unitSku}</small><b>{toman(item.priceToman)}</b></div>
                        </div>
                      ))}
                      {items.length === 0 && <div className={styles.noItems}>اطلاعات قطعه در دسترس نیست.</div>}
                    </div>
                  </div>

                  <aside className={styles.orderSummary}>
                    <div><span>مبلغ سفارش</span><strong>{toman(order.totalToman)}</strong></div>
                    <div><span>گیرنده</span><strong>{order.recipientName}</strong><small>{order.city}، {order.province}</small></div>
                    <div><span>پرداخت</span><strong>{order.payment?.paidAt ? date(order.payment.paidAt) : '—'}</strong></div>
                  </aside>
                </div>

                {(order.shippingCarrier || order.trackingCode || order.fulfillmentStatus === 'SHIPPED' || order.fulfillmentStatus === 'DELIVERED') && (
                  <div className={styles.shipping}>
                    <div><span>روش ارسال</span><strong>{order.shippingCarrier ?? '—'}</strong></div>
                    <div><span>کد رهگیری</span><strong dir="ltr">{order.trackingCode ?? '—'}</strong></div>
                    <div><span>زمان ارسال</span><strong>{date(order.shippedAt)}</strong></div>
                    <div><span>تحویل</span><strong>{date(order.deliveredAt)}</strong></div>
                  </div>
                )}

                <footer className={styles.actions}>
                  {order.invoice && <Link href={`/invoice/${encodeURIComponent(order.invoice.invoiceNumber)}`}>مشاهده فاکتور</Link>}
                  {order.invoice && <Link href={`/verify/${encodeURIComponent(order.invoice.verificationCode)}`}>تأیید اصالت</Link>}
                  <Link href="/track-order">رهگیری سفارش</Link>
                </footer>
              </article>
            );
          })}

          {orders.length === 0 && (
            <div className={styles.empty}>
              <span>NO ORDERS YET</span>
              <h3>هنوز سفارشی ثبت نکرده‌ای.</h3>
              <p>بعد از اولین خرید، وضعیت سفارش و فاکتور از همین بخش در دسترس خواهد بود.</p>
              <Link href="/shop">رفتن به فروشگاه</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
