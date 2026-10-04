import { cookies } from 'next/headers';
import LoginClient from './LoginClient';
import LogoutButton from './LogoutButton';
import styles from './account.module.css';

const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';
const COOKIE_NAME = 'eva_customer_session';

type Order = {
  number: string;
  status: string;
  fulfillmentStatus: 'REGISTERED' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED';
  customerName: string;
  recipientName: string;
  city: string;
  province: string;
  shippingCarrier: string | null;
  trackingCode: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  totalToman: number;
  createdAt: string;
  invoice: { invoiceNumber: string; verificationCode: string } | null;
  payment: { status: string; referenceId: string | null; paidAt: string | null } | null;
  item: { name: string; unitSku: string; weightGram: string; purity: number; priceToman: number } | null;
};

const flow = ['REGISTERED','PREPARING','READY_TO_SHIP','SHIPPED','DELIVERED'] as const;
const labels: Record<(typeof flow)[number], string> = {
  REGISTERED: 'ثبت شد',
  PREPARING: 'در حال آماده‌سازی',
  READY_TO_SHIP: 'آماده ارسال',
  SHIPPED: 'ارسال شد',
  DELIVERED: 'تحویل شد',
};
const orderStatusLabels:Record<string,string>={
  PAID:'پرداخت‌شده',PENDING_PAYMENT:'در انتظار پرداخت',CANCELLED:'لغوشده',REFUND_PENDING:'در انتظار بازپرداخت',REFUNDED:'بازپرداخت‌شده'
};

function toman(value: number) {
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
}
function date(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
function weight(value: string) {
  return `${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/">EVA</a>
        <a className={styles.back} href="/shop">بازگشت به فروشگاه</a>
      </header>

      {orders === null ? (
        <div className={styles.loginWrap}><LoginClient expired={expired} /></div>
      ) : (
        <>
          <div className={styles.accountTop}>
            <div className={styles.intro}>
              <span className={styles.eyebrow}>MY EVA</span>
              <h1>سفارش‌های من</h1>
              <p>حساب متصل به <b dir="ltr">{mobile}</b></p>
            </div>
            <LogoutButton />
          </div>

          <div className={styles.summary}>
            <span>{new Intl.NumberFormat('fa-IR').format(orders.length)} سفارش</span>
            <span>{new Intl.NumberFormat('fa-IR').format(orders.filter((order) => order.status === 'PAID').length)} پرداخت‌شده</span>
          </div>

          <nav className={styles.quickActions} aria-label="دسترسی سریع حساب">
            <a href="/shop"><span>SHOP</span><strong>ادامه خرید</strong><i>←</i></a>
            <a href="/wishlist"><span>WISHLIST</span><strong>علاقه‌مندی‌ها</strong><i>←</i></a>
            <a href="/track-order"><span>TRACK</span><strong>رهگیری سفارش</strong><i>←</i></a>
            <a href="/help"><span>HELP</span><strong>مرکز راهنما</strong><i>←</i></a>
          </nav>

          <section className={styles.orders}>
            {orders.map((order) => {
              const current = flow.indexOf(order.fulfillmentStatus);
              return (
                <article className={styles.orderCard} key={order.number}>
                  <div className={styles.orderHead}>
                    <div>
                      <span className={styles.eyebrow}>ORDER</span>
                      <h2 dir="ltr">{order.number}</h2>
                    </div>
                    <span className={styles.status}>{labels[order.fulfillmentStatus]}</span>
                  </div>

                  <div className={styles.progress}>
                    {flow.map((step, index) => (
                      <div className={index <= current ? styles.stepDone : styles.step} key={step}>
                        <i>{index + 1}</i><span>{labels[step]}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.grid}>
                    <div><span>محصول</span><strong>{order.item?.name ?? '—'}</strong><small>{order.item ? weight(order.item.weightGram) : '—'}</small></div>
                    <div><span>مبلغ</span><strong>{toman(order.totalToman)}</strong><small>پرداخت: {date(order.payment?.paidAt ?? null)}</small></div>
                    <div><span>گیرنده</span><strong>{order.recipientName}</strong><small>{order.city}، {order.province}</small></div>
                    <div><span>تاریخ سفارش</span><strong>{date(order.createdAt)}</strong><small>{orderStatusLabels[order.status]??order.status}</small></div>
                  </div>

                  {(order.shippingCarrier || order.trackingCode || order.fulfillmentStatus === 'SHIPPED' || order.fulfillmentStatus === 'DELIVERED') && (
                    <div className={styles.shipping}>
                      <div><span>روش ارسال</span><strong>{order.shippingCarrier ?? '—'}</strong></div>
                      <div><span>کد رهگیری</span><strong dir="ltr">{order.trackingCode ?? '—'}</strong></div>
                      <div><span>زمان ارسال</span><strong>{date(order.shippedAt)}</strong></div>
                      <div><span>تحویل</span><strong>{date(order.deliveredAt)}</strong></div>
                    </div>
                  )}

                  <div className={styles.actions}>
                    {order.invoice && <a href={`/invoice/${encodeURIComponent(order.invoice.invoiceNumber)}`}>مشاهده فاکتور</a>}
                    {order.invoice && <a href={`/verify/${encodeURIComponent(order.invoice.verificationCode)}`}>تأیید اصالت فاکتور</a>}
                    <a href="/track-order">رهگیری با شماره سفارش</a>
                  </div>
                </article>
              );
            })}
            {orders.length === 0 && <div className={styles.empty}>هنوز سفارشی با این شماره موبایل ثبت نشده.</div>}
          </section>
        </>
      )}
    </main>
  );
}
