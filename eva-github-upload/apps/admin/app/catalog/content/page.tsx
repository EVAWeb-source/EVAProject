import AdminShell from '../../components/AdminShell';
import AdminPageHeader from '../../components/AdminPageHeader';
import BatchContentEditor from '../../components/BatchContentEditor';
import { loadDashboard, requireAdmin } from '../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function CatalogContentPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  const products=(data?.products??[])
    .filter(product=>product.masterSku.startsWith('EVA-AGH-'))
    .sort((a,b)=>a.masterSku.localeCompare(b.masterSku));

  return <AdminShell connected={!error}>
    <AdminPageHeader
      eyebrow="BATCH CONTENT WORKFLOW"
      title="محتوای گروهی کالکشن آغاز"
      description="ویرایش سریع Content و SEO محصولات آغاز در یک صفحه، بدون رفت‌وبرگشت بین Product Editorها."
      actions={<><a href="/catalog/onboarding">Readiness</a><a href="/catalog">کاتالوگ</a></>}
    />
    {error||!data
      ? <section className="setupCard"><h1>اطلاعات کاتالوگ قابل دریافت نیست.</h1><p>{error}</p></section>
      : <BatchContentEditor products={products.map(({id,nameFa,masterSku,status})=>({id,nameFa,masterSku,status}))}/>
    }
  </AdminShell>;
}
