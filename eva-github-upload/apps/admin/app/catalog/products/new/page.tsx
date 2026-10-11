import AdminShell from '../../../components/AdminShell';
import AdminPageHeader from '../../../components/AdminPageHeader';
import ProductCreateForm from '../../../components/ProductCreateForm';
import { loadDashboard, requireAdmin } from '../../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function NewProductPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="NEW PRODUCT" title="محصول جدید" description="ساخت Master Product جدید؛ ابتدا Draft و سپس تکمیل محتوا، تصویر، موجودی و انتشار." actions={<><a href="/catalog">← محصولات</a><a href="/catalog/onboarding">Onboarding</a></>}/>
    {error||!data?<section className="setupCard"><h1>اطلاعات کاتالوگ قابل دریافت نیست.</h1><p>{error}</p></section>:<ProductCreateForm collections={data.collections}/>} 
  </AdminShell>;
}
