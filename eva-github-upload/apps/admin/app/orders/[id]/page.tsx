import { notFound } from 'next/navigation';
import AdminShell from '../../components/AdminShell';
import AdminPageHeader from '../../components/AdminPageHeader';
import styles from './order.module.css';
import { faDate, loadDashboard, loadFulfillment, requireAdmin, statusFa, STOREFRONT_BASE, toman } from '../../lib/admin-data';

export const dynamic='force-dynamic';
const flow=['REGISTERED','PREPARING','READY_TO_SHIP','SHIPPED','DELIVERED'];
const flowLabels:Record<string,string>={REGISTERED:'ثبت شد',PREPARING:'در آماده‌سازی',READY_TO_SHIP:'آماده ارسال',SHIPPED:'ارسال شد',DELIVERED:'تحویل شد'};

export default async function OrderDetailPage({params}:{params:Promise<{id:string}>}){
  await requireAdmin();
  const {id}=await params;
  const [{data,error},{data:fulfillment}]=await Promise.all([loadDashboard(),loadFulfillment()]);
  const order=data?.orders.find(item=>item.id===id);
  if(!order)notFound();
  const full=fulfillment?.orders.find(item=>item.id===id)??null;
  const current=flow.indexOf(full?.fulfillmentStatus??order.fulfillmentStatus??'REGISTERED');

  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="ORDER DETAIL" title={order.orderNumber} description={`${order.customerName} • ${statusFa(order.status)}`} actions={<><a href="/orders">← سفارش‌ها</a>{order.status==='PAID'&&<a href="/fulfillment">Fulfillment</a>}</>}/>
    <div className={styles.grid}>
      <section className={styles.card}><div className={styles.head}><span>ORDER</span><h2>اطلاعات سفارش</h2></div><div className={styles.rows}>
        <div className={styles.row}><span>وضعیت سفارش</span><strong>{statusFa(order.status)}</strong></div>
        <div className={styles.row}><span>مبلغ</span><strong>{toman(order.totalToman)}</strong></div>
        <div className={styles.row}><span>تاریخ ثبت</span><strong>{faDate(order.createdAt)}</strong></div>
        <div className={styles.row}><span>محصول</span><strong>{order.item?.productNameFa??'—'}</strong></div>
        <div className={styles.row}><span>Unit</span><strong dir="ltr">{order.item?.unitSku??'—'}</strong></div>
        <div className={styles.row}><span>وزن</span><strong>{order.item?`${order.item.exactWeightGram} گرم`:'—'}</strong></div>
      </div></section>

      <section className={styles.card}><div className={styles.head}><span>CUSTOMER</span><h2>مشتری و ارسال</h2></div><div className={styles.rows}>
        <div className={styles.row}><span>مشتری</span><strong>{order.customerName}</strong></div>
        <div className={styles.row}><span>موبایل</span><strong dir="ltr">{order.mobile}</strong></div>
        <div className={styles.row}><span>گیرنده</span><strong>{full?.recipientName??'—'}</strong></div>
        <div className={styles.row}><span>شهر</span><strong>{full?`${full.province} / ${full.city}`:order.city}</strong></div>
        <div className={styles.row}><span>کدپستی</span><strong dir="ltr">{full?.postalCode??'—'}</strong></div>
        <div className={styles.row}><span>آدرس</span><strong className={styles.address}>{full?.address??'—'}</strong></div>
      </div></section>

      <section className={`${styles.card} ${styles.full}`}><div className={styles.head}><span>FULFILLMENT</span><h2>مسیر آماده‌سازی و ارسال</h2></div><div className={styles.timeline}>{flow.map((step,index)=><div key={step} className={index<=current?styles.done:styles.step}><i>{index<=current?'✓':index+1}</i><span>{flowLabels[step]}</span></div>)}</div><div className={styles.rows}>
        <div className={styles.row}><span>شرکت حمل</span><strong>{full?.shippingCarrier??'—'}</strong></div><div className={styles.row}><span>کد رهگیری</span><strong dir="ltr">{full?.trackingCode??'—'}</strong></div>
      </div><div className={styles.actions}>{order.invoiceNumber&&<a href={`${STOREFRONT_BASE}/invoice/${encodeURIComponent(order.invoiceNumber)}`} target="_blank" rel="noreferrer">فاکتور ↗</a>}<a href="/fulfillment">مدیریت Fulfillment</a></div></section>

      <section className={styles.card}><div className={styles.head}><span>PAYMENT</span><h2>پرداخت</h2></div><div className={styles.rows}>
        <div className={styles.row}><span>Provider</span><strong>{order.payment?.provider??'—'}</strong></div><div className={styles.row}><span>وضعیت</span><strong>{statusFa(order.payment?.status??order.status)}</strong></div><div className={styles.row}><span>Reference</span><strong dir="ltr">{order.payment?.referenceId??'—'}</strong></div><div className={styles.row}><span>زمان پرداخت</span><strong>{order.payment?.paidAt?faDate(order.payment.paidAt):'—'}</strong></div>
      </div></section>

      <section className={styles.card}><div className={styles.head}><span>INVOICE</span><h2>فاکتور</h2></div><div className={styles.rows}><div className={styles.row}><span>شماره فاکتور</span><strong dir="ltr">{order.invoiceNumber??'—'}</strong></div></div>{order.invoiceNumber&&<div className={styles.actions}><a href={`${STOREFRONT_BASE}/invoice/${encodeURIComponent(order.invoiceNumber)}`} target="_blank" rel="noreferrer">باز کردن فاکتور ↗</a></div>}</section>
    </div>
  </AdminShell>;
}
