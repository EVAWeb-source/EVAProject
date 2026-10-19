import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import styles from './invoices.module.css';
import { faDate, loadDashboard, requireAdmin, statusFa, STOREFRONT_BASE, toman } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function InvoicesPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="FINANCE" title="فاکتورها" description="فاکتورهای صادرشده و لینک‌های عمومی هر سفارش."/>
    {error||!data?<section className="setupCard"><h1>فاکتورها قابل دریافت نیستند.</h1><p>{error}</p></section>:<section className={styles.wrap}>
      <div className={styles.top}><strong>{new Intl.NumberFormat('fa-IR').format(data.invoices.length)} فاکتور</strong><span>هر فاکتور یک Snapshot مستقل از سفارش صادرشده است.</span></div>
      <div className={styles.list}>{data.invoices.map(invoice=>{const items=invoice.items?.length?invoice.items:invoice.item?[invoice.item]:[];return <article className={styles.card} key={invoice.id}>
        <div className={styles.head}><div><strong dir="ltr">{invoice.invoiceNumber}</strong><small>{faDate(invoice.issuedAt)}</small></div><span className={`badge ${invoice.status.toLowerCase()}`}>{statusFa(invoice.status)}</span></div>
        <div className={styles.body}>
          <div className={styles.customer}><span>مشتری</span><strong>{invoice.customerName}</strong><small dir="ltr">{invoice.customerMobile}</small></div>
          <div className={styles.items}><span>قطعات</span><strong>{new Intl.NumberFormat('fa-IR').format(items.length)} قطعه</strong>{items.slice(0,3).map(item=><small key={item.unitSku}>{item.productNameFa} · <b dir="ltr">{item.unitSku}</b></small>)}{items.length>3&&<small>+ {new Intl.NumberFormat('fa-IR').format(items.length-3)} قطعه دیگر</small>}</div>
          <div className={styles.total}><span>مبلغ نهایی</span><strong>{toman(invoice.totalToman)}</strong></div>
        </div>
        <div className={styles.actions}>{invoice.accessToken&&<a href={`${STOREFRONT_BASE}/invoice/${encodeURIComponent(invoice.invoiceNumber)}?accessToken=${encodeURIComponent(invoice.accessToken)}`} target="_blank" rel="noreferrer">مشاهده فاکتور</a>}<a href={`${STOREFRONT_BASE}/verify/${encodeURIComponent(invoice.verificationCode)}`} target="_blank" rel="noreferrer">Verify</a><a href={`/orders/${invoice.orderId}`}>سفارش</a></div>
      </article>})}{data.invoices.length===0&&<div className={styles.empty}>هنوز فاکتوری صادر نشده است.</div>}</div>
    </section>}
  </AdminShell>;
}
