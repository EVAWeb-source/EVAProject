import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import CustomersTable from '../components/CustomersTable';
import { loadCustomers, requireAdmin } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function CustomersPage(){
  await requireAdmin();
  const {data,error}=await loadCustomers();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="CRM" title="مشتری‌ها" description="پروفایل مستقل مشتری، تاریخچه خرید و یادداشت داخلی ادمین." actions={<a href="/orders">سفارش‌ها</a>}/>
    {error||!data?<section className="setupCard"><h1>اطلاعات مشتری‌ها قابل دریافت نیست.</h1><p>{error}</p></section>:<CustomersTable data={data}/>} 
  </AdminShell>;
}
