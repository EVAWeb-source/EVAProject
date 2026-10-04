import AdminShell from './components/AdminShell';
import AdminPageHeader from './components/AdminPageHeader';
import styles from './dashboard.module.css';
import { faDate, faNumber, loadCatalogReadiness, loadDashboard, requireAdmin, statusFa, toman } from './lib/admin-data';

export const dynamic='force-dynamic';

export default async function DashboardPage(){
  await requireAdmin();
  const [{data,error},{data:readiness}]=await Promise.all([loadDashboard(),loadCatalogReadiness()]);

  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="OPERATIONS OVERVIEW" title="داشبورد EVA" description="خلاصه وضعیت فروشگاه؛ برای انجام کارها وارد ماژول مربوطه شو." meta={data?`آخرین بروزرسانی: ${faDate(data.generatedAt)}`:undefined}/>

    {error||!data?<div className={styles.error}>{error??'اطلاعات داشبورد قابل دریافت نیست.'}</div>:<>
      <section className={styles.metrics}>
        <article><span>محصول فعال</span><b>{faNumber(data.summary.activeProducts)}</b><small>{faNumber(data.products.length)} محصول کل</small></article>
        <article><span>Unit موجود</span><b>{faNumber(data.summary.units.available)}</b><small>{faNumber(data.summary.units.reserved)} رزرو فعال</small></article>
        <article><span>سفارش پرداخت‌شده</span><b>{faNumber(data.summary.orders.paid)}</b><small>{faNumber(data.summary.orders.pending)} در انتظار پرداخت</small></article>
        <article><span>فاکتور صادرشده</span><b>{faNumber(data.summary.invoices)}</b><small>Invoice Snapshot</small></article>
        <article><span>Unit فروخته‌شده</span><b>{faNumber(data.summary.units.sold)}</b><small>از {faNumber(data.summary.units.total)} Unit</small></article>
        <article className={styles.wide}><span>فروش ثبت‌شده آزمایشی</span><b>{toman(data.summary.paidRevenueToman)}</b><small>جمع سفارش‌های PAID فعلی</small></article>
      </section>

      <section className={styles.layout}>
        <div className={styles.panel}>
          <div className={styles.head}><div><span>WORK QUEUE</span><h2>کارهایی که نیاز به توجه دارند</h2></div><a href="/catalog/onboarding">مشاهده Onboarding</a></div>
          <div className={styles.queue}>
            <a href="/catalog/onboarding"><div><strong>محصول آماده انتشار</strong><small>همه مراحل تکمیل شده و فقط Publish مانده</small></div><b>{faNumber(readiness?.summary.readyToPublish??0)}</b></a>
            <a href="/catalog/onboarding"><div><strong>محتوای ناقص</strong><small>توضیح، Story یا اطلاعات پایه نیاز به تکمیل دارد</small></div><b>{faNumber(readiness?.summary.needsContent??0)}</b></a>
            <a href="/catalog/onboarding"><div><strong>بدون تصویر اصلی</strong><small>برای انتشار باید Main Image و Alt Text ثبت شود</small></div><b>{faNumber(readiness?.summary.needsMedia??0)}</b></a>
            <a href="/inventory"><div><strong>بدون Unit موجود</strong><small>محصول‌هایی که Unit قابل‌فروش ندارند</small></div><b>{faNumber(readiness?.summary.needsInventory??0)}</b></a>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.head}><div><span>QUICK ACCESS</span><h2>دسترسی سریع</h2></div></div>
          <div className={styles.quick}>
            <a href="/catalog"><span>CATALOG</span><strong>مدیریت محصولات</strong><small>لیست و ویرایش محصول</small></a>
            <a href="/catalog/onboarding"><span>ONBOARDING</span><strong>ورود محصول جدید</strong><small>Draft تا Publish</small></a>
            <a href="/orders"><span>ORDERS</span><strong>سفارش‌ها</strong><small>پرداخت و جزئیات سفارش</small></a>
            <a href="/fulfillment"><span>FULFILLMENT</span><strong>آماده‌سازی و ارسال</strong><small>از ثبت تا تحویل</small></a>
          </div>
        </div>
      </section>

      <section className={`${styles.panel} ${styles.recent}`}>
        <div className={styles.head}><div><span>RECENT ORDERS</span><h2>آخرین سفارش‌ها</h2></div><a href="/orders">همه سفارش‌ها</a></div>
        <div>{data.orders.slice(0,6).map(order=><div className={styles.orderRow} key={order.id}>
          <div><strong dir="ltr">{order.orderNumber}</strong><small>{statusFa(order.status)}</small></div>
          <div><strong>{order.customerName}</strong><small>{order.city}</small></div>
          <div><strong>{toman(order.totalToman)}</strong><small>{order.item?.productNameFa??'—'}</small></div>
          <a href={`/orders/${order.id}`}>جزئیات</a>
        </div>)}</div>
      </section>
    </>}
  </AdminShell>;
}
