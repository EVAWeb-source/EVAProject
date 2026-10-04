import AdminShell from '../../components/AdminShell';
import AdminPageHeader from '../../components/AdminPageHeader';
import CatalogOnboardingPanel from '../../components/CatalogOnboardingPanel';
import { loadDashboard, requireAdmin } from '../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function OnboardingPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="CATALOG ONBOARDING" title="آماده‌سازی محصولات" description="مسیر کنترل‌شده از Draft تا Publish؛ محصول ناقص وارد فروشگاه نمی‌شود." actions={<><a href="/catalog/content">محتوای گروهی</a><a href="/catalog">لیست محصولات</a></>}/>
    {error||!data?<section className="setupCard"><h1>اطلاعات کاتالوگ قابل دریافت نیست.</h1><p>{error}</p></section>:<CatalogOnboardingPanel collections={data.collections}/>} 
  </AdminShell>;
}
