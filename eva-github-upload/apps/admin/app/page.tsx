import AdminShell from './components/AdminShell';
import AdminPageHeader from './components/AdminPageHeader';
import styles from './dashboard.module.css';
import { faDate, faNumber, loadCatalogReadiness, loadDashboard, loadOperations, requireAdmin, statusFa, toman } from './lib/admin-data';

export const dynamic='force-dynamic';

const severityLabel:Record<string,string>={ok:'اوکی',warning:'نیاز به توجه',danger:'فوری'};

export default async function DashboardPage(){
  await requireAdmin();
  const [{data,error},{data:readiness},{data:operations}]=await Promise.all([loadDashboard(),loadCatalogReadiness(),loadOperations()]);

  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="OPERATIONS OVERVIEW" title="داشبورد EVA" description="وضعیت روزانه فروشگاه، هشدارها و کارهایی که نیاز به رسیدگی دارند." meta={data?`آخرین بروزرسانی: ${faDate(data.generatedAt)}`:undefined} actions={<a href="/audit">تاریخچه فعالیت</a>}/>

    {error||!data?<div className={styles.error}>{error??'اطلاعات داشبورد قابل دریافت نیست.'}</div>:<>
      <section className={styles.metrics}>
        <article><span>محصول فعال</span><b>{faNumber(data.summary.activeProducts)}</b><small>{faNumber(data.products.length)} محصول کل</small></article>
        <article><span>Unit موجود</span><b>{faNumber(data.summary.units.available)}</b><small>{faNumber(operations?.metrics.inventoryAttention??0)} نیازمند توجه</small></article>
        <article><span>آماده ارسال</span><b>{faNumber(operations?.metrics.readyToShip??0)}</b><small>{faNumber(operations?.metrics.overdueFulfillment??0)} معطل بیش از ۲۴ ساعت</small></article>
        <article><span>After Sales باز</span><b>{faNumber(operations?.metrics.openAfterSales??0)}</b><small>لغو، مرجوعی، QC و Refund</small></article>
        <article><span>موجودی کم</span><b>{faNumber(operations?.metrics.lowStockProducts??0)}</b><small>محصول فعال با ≤ ۱ Unit</small></article>
        <article className={styles.wide}><span>فروش ثبت‌شده آزمایشی</span><b>{toman(data.summary.paidRevenueToman)}</b><small>{faNumber(data.summary.orders.paid)} سفارش PAID فعلی</small></article>
      </section>

      <section className={styles.layout}>
        <div className={styles.panel}>
          <div className={styles.head}><div><span>OPERATIONAL ALERTS</span><h2>هشدارهای عملیاتی</h2></div><a href="/audit">Audit Trail</a></div>
          <div className={styles.alerts}>
            {(operations?.alerts??[]).map(alert=><a href={alert.href} key={alert.key} className={`${styles.alert} ${styles[alert.severity]}`}>
              <i>{severityLabel[alert.severity]??alert.severity}</i><div><strong>{alert.title}</strong><small>{alert.detail}</small></div><b>{faNumber(alert.count)}</b>
            </a>)}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.head}><div><span>WORK QUEUE</span><h2>کارهای کاتالوگ</h2></div><a href="/catalog/onboarding">Onboarding</a></div>
          <div className={styles.queue}>
            <a href="/catalog/onboarding"><div><strong>محصول آماده انتشار</strong><small>فقط Publish مانده</small></div><b>{faNumber(readiness?.summary.readyToPublish??0)}</b></a>
            <a href="/catalog/content"><div><strong>محتوای ناقص</strong><small>Content یا SEO نیاز به تکمیل دارد</small></div><b>{faNumber((readiness?.summary.needsContent??0)+(readiness?.summary.needsSeo??0))}</b></a>
            <a href="/catalog/onboarding"><div><strong>بدون تصویر اصلی</strong><small>Main Image و Alt Text لازم است</small></div><b>{faNumber(readiness?.summary.needsMedia??0)}</b></a>
            <a href="/inventory"><div><strong>بدون Unit موجود</strong><small>محصول بدون Unit قابل فروش</small></div><b>{faNumber(readiness?.summary.needsInventory??0)}</b></a>
          </div>
        </div>
      </section>

      <section className={styles.layoutSecondary}>
        <div className={styles.panel}>
          <div className={styles.head}><div><span>LOW STOCK</span><h2>موجودی کم</h2></div><a href="/inventory">مدیریت موجودی</a></div>
          <div className={styles.stockList}>{(operations?.lowStockProducts??[]).slice(0,8).map(product=><a href={`/inventory?productId=${product.id}`} key={product.id}><div><strong>{product.nameFa}</strong><small dir="ltr">{product.masterSku}</small></div><b>{faNumber(product.availableUnits)} Unit</b></a>)}{(operations?.lowStockProducts??[]).length===0&&<div className={styles.empty}>موجودی فعال‌ها در وضعیت مناسبی است.</div>}</div>
        </div>

        <div className={styles.panel}>
          <div className={styles.head}><div><span>RECENT AUDIT</span><h2>آخرین تغییرات ادمین</h2></div><a href="/audit">همه فعالیت‌ها</a></div>
          <div className={styles.auditList}>{(operations?.recentAudit??[]).map(item=><div key={item.id}><div><strong>{item.summary}</strong><small>{item.entityType} • {item.action}</small></div><time>{faDate(item.createdAt)}</time></div>)}{(operations?.recentAudit??[]).length===0&&<div className={styles.empty}>هنوز رویداد Audit ثبت نشده.</div>}</div>
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
