import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import AuditTable from '../components/AuditTable';
import { faNumber, loadAuditLog, requireAdmin } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function AuditPage(){
  await requireAdmin();
  const {data,error}=await loadAuditLog();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="AUDIT TRAIL" title="تاریخچه فعالیت ادمین" description="ثبت تغییرات مهم عملیاتی برای پیگیری اینکه چه چیزی در فروشگاه تغییر کرده است."/>
    {error||!data?<section className="setupCard"><h1>تاریخچه فعالیت قابل دریافت نیست.</h1><p>{error}</p></section>:<>
      <section className="summaryCards">
        <article><span>امروز</span><strong>{faNumber(data.summary.today)}</strong></article>
        <article><span>۷ روز اخیر</span><strong>{faNumber(data.summary.last7Days)}</strong></article>
        <article><span>نمایش داده‌شده</span><strong>{faNumber(data.summary.totalShown)}</strong></article>
      </section>
      <AuditTable items={data.items}/>
    </>}
  </AdminShell>;
}
