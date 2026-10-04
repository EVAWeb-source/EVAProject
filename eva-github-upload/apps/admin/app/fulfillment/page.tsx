import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import FulfillmentClient from './FulfillmentClient';
import styles from './fulfillment.module.css';
import { faNumber, loadFulfillment, requireAdmin, STOREFRONT_BASE } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function FulfillmentPage(){
  await requireAdmin();
  const {data,error}=await loadFulfillment();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="FULFILLMENT OPERATIONS" title="آماده‌سازی و ارسال" description="مدیریت مرحله‌به‌مرحله سفارش‌های پرداخت‌شده تا تحویل نهایی." actions={<a href="/orders">سفارش‌ها</a>}/>
    {error||!data?<div className={`${styles.notice} ${styles.noticeError}`}>{error??'اطلاعات قابل دریافت نیست.'}</div>:<>
      <section className={styles.summary}>
        <article><span>ثبت‌شده</span><b>{faNumber(data.summary.REGISTERED??0)}</b></article>
        <article><span>در حال آماده‌سازی</span><b>{faNumber(data.summary.PREPARING??0)}</b></article>
        <article><span>آماده ارسال</span><b>{faNumber(data.summary.READY_TO_SHIP??0)}</b></article>
        <article><span>ارسال‌شده</span><b>{faNumber(data.summary.SHIPPED??0)}</b></article>
        <article><span>تحویل‌شده</span><b>{faNumber(data.summary.DELIVERED??0)}</b></article>
      </section>
      <FulfillmentClient orders={data.orders} storefrontBase={STOREFRONT_BASE}/>
    </>}
  </AdminShell>;
}
