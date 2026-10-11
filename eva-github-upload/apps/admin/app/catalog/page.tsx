import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import CatalogTable from '../components/CatalogTable';
import { loadDashboard, requireAdmin } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function CatalogPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="CATALOG" title="محصولات" description="ساخت، ویرایش، موجودی و وضعیت انتشار همه محصولات EVA." actions={<><a href="/catalog/products/new">+ محصول جدید</a><a href="/catalog/onboarding">Onboarding</a></>}/>
    {error||!data?<section className="setupCard"><h1>کاتالوگ قابل دریافت نیست.</h1><p>{error}</p></section>:<CatalogTable products={data.products}/>} 
  </AdminShell>;
}
