import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import OrdersTable from '../components/OrdersTable';
import { loadDashboard, requireAdmin } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function OrdersPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="COMMERCE" title="سفارش‌ها" description="جستجو، بررسی پرداخت و ورود به جزئیات هر سفارش." actions={<a href="/fulfillment">آماده‌سازی و ارسال</a>}/>
    {error||!data?<section className="setupCard"><h1>سفارش‌ها قابل دریافت نیستند.</h1><p>{error}</p></section>:<OrdersTable orders={data.orders}/>} 
  </AdminShell>;
}
