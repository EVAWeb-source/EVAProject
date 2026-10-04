import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import AfterSalesPanel from '../components/AfterSalesPanel';
import { requireAdmin } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function AfterSalesPage(){
  await requireAdmin();
  return <AdminShell>
    <AdminPageHeader eyebrow="AFTER SALES" title="لغو و مرجوعی" description="مدیریت کنترل‌شده لغو سفارش، بازپرداخت، دریافت مرجوعی و QC؛ Return با Buyback یکی نیست." actions={<a href="/orders">سفارش‌ها</a>}/>
    <AfterSalesPanel/>
  </AdminShell>;
}
