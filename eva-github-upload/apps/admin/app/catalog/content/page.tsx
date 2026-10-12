import AdminShell from '../../components/AdminShell';
import AdminPageHeader from '../../components/AdminPageHeader';
import BatchContentEditor from '../../components/BatchContentEditor';
import { loadDashboard, requireAdmin } from '../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function CatalogContentPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  const products=(data?.products??[]).slice().sort((a,b)=>a.nameFa.localeCompare(b.nameFa,'fa'));

  return <AdminShell connected={!error}>
    <AdminPageHeader
      eyebrow="کاتالوگ"
      title="محتوای محصولات"
      description="ویرایش سریع محتوا و SEO همه محصولات در یک صفحه."
      actions={<><a href="/catalog/onboarding">آمادگی انتشار</a><a href="/catalog">محصولات</a></>}
    />
    {error||!data
      ? <section className="setupCard"><h1>اطلاعات کاتالوگ قابل دریافت نیست.</h1><p>{error}</p></section>
      : <BatchContentEditor products={products.map(({id,nameFa,masterSku,status})=>({id,nameFa,masterSku,status}))}/>
    }
  </AdminShell>;
}
