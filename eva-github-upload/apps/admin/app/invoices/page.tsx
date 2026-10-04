import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import { faDate, loadDashboard, requireAdmin, statusFa, STOREFRONT_BASE, toman } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function InvoicesPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="FINANCE" title="فاکتورها" description="فاکتورهای صادرشده، لینک عمومی Verify و Snapshot مالی هر سفارش."/>
    {error||!data?<section className="setupCard"><h1>فاکتورها قابل دریافت نیستند.</h1><p>{error}</p></section>:<section className="panel"><div className="panelHead"><div><span>INVOICES</span><h2>فاکتورهای صادرشده</h2></div><small>{data.invoices.length} فاکتور</small></div><div className="tableWrap"><table><thead><tr><th>شماره فاکتور</th><th>مشتری</th><th>محصول</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ صدور</th><th>لینک‌ها</th></tr></thead><tbody>
      {data.invoices.map(invoice=><tr key={invoice.id}><td><strong dir="ltr">{invoice.invoiceNumber}</strong></td><td><strong>{invoice.customerName}</strong><small dir="ltr">{invoice.customerMobile}</small></td><td>{invoice.item?.productNameFa??'—'}</td><td>{toman(invoice.totalToman)}</td><td><span className={`badge ${invoice.status.toLowerCase()}`}>{statusFa(invoice.status)}</span></td><td>{faDate(invoice.issuedAt)}</td><td><div className="adminLinks"><a className="adminLink" href={`${STOREFRONT_BASE}/invoice/${encodeURIComponent(invoice.invoiceNumber)}`} target="_blank" rel="noreferrer">فاکتور ↗</a><a className="adminLink" href={`${STOREFRONT_BASE}/verify/${encodeURIComponent(invoice.verificationCode)}`} target="_blank" rel="noreferrer">Verify ↗</a><a className="adminLink" href={`/orders/${invoice.orderId}`}>سفارش</a></div></td></tr>)}
      {data.invoices.length===0&&<tr><td colSpan={7}>هنوز فاکتوری صادر نشده است.</td></tr>}
    </tbody></table></div></section>}
  </AdminShell>;
}
