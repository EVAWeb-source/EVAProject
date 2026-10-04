import { notFound } from 'next/navigation';
import AdminShell from '../../components/AdminShell';
import AdminPageHeader from '../../components/AdminPageHeader';
import CustomerNoteEditor from '../../components/CustomerNoteEditor';
import { faDate, loadCustomer, requireAdmin, statusFa, toman } from '../../lib/admin-data';
import styles from './customer.module.css';

export const dynamic='force-dynamic';

export default async function CustomerDetailPage({params}:{params:Promise<{id:string}>}){
  await requireAdmin();
  const {id}=await params;
  const {data,error}=await loadCustomer(id);
  if(!data&&!error)notFound();
  if(!data)return <AdminShell connected={false}><section className="setupCard"><h1>پروفایل مشتری قابل دریافت نیست.</h1><p>{error}</p></section></AdminShell>;

  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="CUSTOMER PROFILE" title={data.name||data.mobile} description={`موبایل ${data.mobile} • ${data.summary.orderCount} سفارش`} actions={<a href="/customers">← مشتری‌ها</a>}/>
    <div className={styles.summary}>
      <div><span>کل سفارش‌ها</span><strong>{new Intl.NumberFormat('fa-IR').format(data.summary.orderCount)}</strong></div>
      <div><span>پرداخت‌شده</span><strong>{new Intl.NumberFormat('fa-IR').format(data.summary.paidOrderCount)}</strong></div>
      <div><span>بازپرداخت‌شده</span><strong>{new Intl.NumberFormat('fa-IR').format(data.summary.refundedOrderCount)}</strong></div>
      <div><span>مجموع خرید فعال</span><strong>{toman(data.summary.totalPaidToman)}</strong></div>
    </div>
    <div className={styles.grid}>
      <section className={styles.card}><div className={styles.head}><span>PROFILE</span><h2>اطلاعات مشتری</h2></div><div className={styles.rows}>
        <div className={styles.row}><span>نام</span><strong>{data.name||'—'}</strong></div>
        <div className={styles.row}><span>موبایل</span><strong dir="ltr">{data.mobile}</strong></div>
        <div className={styles.row}><span>اولین ثبت پروفایل</span><strong>{faDate(data.createdAt)}</strong></div>
        <div className={styles.row}><span>آخرین تغییر</span><strong>{faDate(data.updatedAt)}</strong></div>
      </div></section>
      <CustomerNoteEditor id={data.id} name={data.name} internalNote={data.internalNote}/>

      <section className={styles.orders}><div className={styles.head}><span>ORDER HISTORY</span><h2>تاریخچه سفارش‌ها</h2></div><div className={styles.tableWrap}><table><thead><tr><th>سفارش</th><th>محصول</th><th>وضعیت</th><th>ارسال</th><th>مبلغ</th><th>تاریخ</th><th>After Sales</th><th></th></tr></thead><tbody>
        {data.orders.map(order=><tr key={order.id}><td dir="ltr">{order.orderNumber}</td><td><strong>{order.item?.productNameFa??'—'}</strong><small dir="ltr">{order.item?.unitSku??''}</small></td><td>{statusFa(order.status)}</td><td>{statusFa(order.fulfillmentStatus)}</td><td>{toman(order.totalToman)}</td><td>{faDate(order.createdAt)}</td><td>{order.afterSales?<span className={styles.after}>{statusFa(order.afterSales.type)} • {statusFa(order.afterSales.status)}</span>:'—'}</td><td><a href={`/orders/${order.id}`}>جزئیات ←</a></td></tr>)}
        {data.orders.length===0&&<tr><td colSpan={8} className={styles.empty}>هنوز سفارشی برای این مشتری ثبت نشده.</td></tr>}
      </tbody></table></div></section>
    </div>
  </AdminShell>;
}
