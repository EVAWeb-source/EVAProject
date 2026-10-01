'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './fulfillment.module.css';

type FulfillmentStatus = 'REGISTERED' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED';

type Order = {
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
};

const labels: Record<FulfillmentStatus, string> = {
  REGISTERED: 'ثبت شد',
  PREPARING: 'در حال آماده‌سازی',
  READY_TO_SHIP: 'آماده ارسال',
  SHIPPED: 'ارسال شد',
  DELIVERED: 'تحویل شد',
};

const nextStatus: Partial<Record<FulfillmentStatus, FulfillmentStatus>> = {
  REGISTERED: 'PREPARING',
  PREPARING: 'READY_TO_SHIP',
  READY_TO_SHIP: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

const actionLabel: Partial<Record<FulfillmentStatus, string>> = {
  REGISTERED: 'شروع آماده‌سازی',
  PREPARING: 'آماده ارسال شد',
  READY_TO_SHIP: 'ثبت ارسال',
  SHIPPED: 'ثبت تحویل',
};

function toman(value: number) {
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
}

function date(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function FulfillmentClient({ orders, storefrontBase }: { orders: Order[]; storefrontBase: string }) {
  const router = useRouter();
  const inFlight = useRef<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<Record<string, { carrier: string; tracking: string }>>({});

  const activeOrders = useMemo(() => orders.filter((order) => order.fulfillmentStatus !== 'DELIVERED'), [orders]);

  async function advance(order: Order) {
    if (inFlight.current.has(order.id)) return;

    const target = nextStatus[order.fulfillmentStatus];
    if (!target) return;

    const shippingValue = shipping[order.id] ?? { carrier: '', tracking: '' };
    if (target === 'SHIPPED' && (!shippingValue.carrier.trim() || !shippingValue.tracking.trim())) {
      setError('برای ثبت ارسال، روش/شرکت ارسال و کد رهگیری را وارد کن.');
      return;
    }

    inFlight.current.add(order.id);
    setBusyId(order.id);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/fulfillment`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: target,
          ...(target === 'SHIPPED'
            ? { shippingCarrier: shippingValue.carrier.trim(), trackingCode: shippingValue.tracking.trim() }
            : {}),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      const detail = payload?.message ?? payload?.error ?? `خطای ${response.status}`;

      if (!response.ok) {
        if (response.status === 409 && String(detail).includes('one step at a time')) {
          setMessage('وضعیت سفارش ثبت شده بود؛ اطلاعات تازه شد.');
          router.refresh();
          return;
        }
        throw new Error(detail);
      }

      setMessage(`وضعیت سفارش ${order.orderNumber} به «${labels[target]}» تغییر کرد.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'بروزرسانی وضعیت انجام نشد.');
    } finally {
      inFlight.current.delete(order.id);
      setBusyId(null);
    }
  }

  return (
    <>
      {(message || error) && <div className={`${styles.notice} ${error ? styles.noticeError : ''}`}>{error ?? message}</div>}
      <div className={styles.queueIntro}>
        <strong>{new Intl.NumberFormat('fa-IR').format(activeOrders.length)} سفارش در جریان</strong>
        <span>هر سفارش فقط یک مرحله به جلو می‌رود تا تاریخچه عملیات اشتباه نشود.</span>
      </div>

      <div className={styles.orderList}>
        {orders.map((order) => {
          const target = nextStatus[order.fulfillmentStatus];
          const shipInput = shipping[order.id] ?? { carrier: order.shippingCarrier ?? '', tracking: order.trackingCode ?? '' };
          return (
            <article className={styles.orderCard} key={order.id}>
              <div className={styles.orderHead}>
                <div>
                  <span className={styles.eyebrow}>ORDER</span>
                  <h2 dir="ltr">{order.orderNumber}</h2>
                </div>
                <span className={`${styles.fulfillmentBadge} ${styles[order.fulfillmentStatus.toLowerCase()]}`}>{labels[order.fulfillmentStatus]}</span>
              </div>

              <div className={styles.progress} aria-label="مراحل آماده‌سازی و ارسال">
                {(['REGISTERED', 'PREPARING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'] as FulfillmentStatus[]).map((step, index) => {
                  const current = ['REGISTERED', 'PREPARING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'].indexOf(order.fulfillmentStatus);
                  return <div key={step} className={index <= current ? styles.stepDone : styles.step}><i>{index + 1}</i><span>{labels[step]}</span></div>;
                })}
              </div>

              <div className={styles.infoGrid}>
                <div><span>مشتری</span><strong>{order.customerName}</strong><small dir="ltr">{order.mobile}</small></div>
                <div><span>گیرنده</span><strong>{order.recipientName}</strong><small>{order.city}، {order.province}</small></div>
                <div><span>محصول</span><strong>{order.item?.productNameFa ?? '—'}</strong><small>{order.item ? `${order.item.exactWeightGram} گرم · ${order.item.unitSku}` : '—'}</small></div>
                <div><span>مبلغ</span><strong>{toman(order.totalToman)}</strong><small>پرداخت: {date(order.payment?.paidAt ?? null)}</small></div>
              </div>

              <div className={styles.addressBox}>
                <span>آدرس ارسال</span>
                <strong>{order.province}، {order.city}، {order.address}</strong>
                <small>کدپستی: <b dir="ltr">{order.postalCode}</b></small>
              </div>

              {(order.fulfillmentStatus === 'READY_TO_SHIP' || order.fulfillmentStatus === 'SHIPPED' || order.fulfillmentStatus === 'DELIVERED') && (
                <div className={styles.shippingGrid}>
                  <label>
                    روش / شرکت ارسال
                    <input
                      value={shipInput.carrier}
                      disabled={order.fulfillmentStatus !== 'READY_TO_SHIP'}
                      placeholder="مثلاً پست پیشتاز"
                      onChange={(event) => setShipping((current) => ({ ...current, [order.id]: { ...shipInput, carrier: event.target.value } }))}
                    />
                  </label>
                  <label>
                    کد رهگیری
                    <input
                      value={shipInput.tracking}
                      disabled={order.fulfillmentStatus !== 'READY_TO_SHIP'}
                      placeholder="کد رهگیری مرسوله"
                      dir="ltr"
                      onChange={(event) => setShipping((current) => ({ ...current, [order.id]: { ...shipInput, tracking: event.target.value } }))}
                    />
                  </label>
                </div>
              )}

              <div className={styles.metaLine}>
                <span>ثبت سفارش: {date(order.createdAt)}</span>
                <span>ارسال: {date(order.shippedAt)}</span>
                <span>تحویل: {date(order.deliveredAt)}</span>
              </div>

              <div className={styles.actions}>
                {target ? <button disabled={busyId === order.id} onClick={() => advance(order)}>{busyId === order.id ? 'در حال ثبت…' : actionLabel[order.fulfillmentStatus]}</button> : <strong className={styles.doneText}>فرآیند این سفارش تکمیل شده است.</strong>}
                {order.invoiceNumber && <a href={`${storefrontBase}/invoice/${encodeURIComponent(order.invoiceNumber)}`} target="_blank" rel="noreferrer">مشاهده فاکتور</a>}
              </div>
            </article>
          );
        })}

        {orders.length === 0 && <div className={styles.empty}>هنوز سفارش پرداخت‌شده‌ای برای آماده‌سازی وجود ندارد.</div>}
      </div>
    </>
  );
}
