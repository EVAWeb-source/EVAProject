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
      <section className="notificationSummary">
        <article><span>امروز</span><b>{faNumber(data.summary.today)}</b></article>
        <article><span>۷ روز اخیر</span><b>{faNumber(data.summary.last7Days)}</b></article>
        <article><span>نمایش داده‌شده</span><b>{faNumber(data.summary.totalShown)}</b></article>
      </section>
      <AuditTable items={data.items}/>
    </>}
  </AdminShell>;
}
