import AdminPageHeader from '../../components/AdminPageHeader';
import AdminShell from '../../components/AdminShell';
import SiteMediaManager from '../../components/SiteMediaManager';
import { requireAdmin } from '../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function CatalogMediaPage(){
  await requireAdmin();
  return <AdminShell>
    <AdminPageHeader
      eyebrow="رسانه‌ها"
      title="تصاویر سایت"
      description="Hero، داستان EVA و کارت‌های کالکشن را با ابعاد استاندارد هر جایگاه مدیریت کن."
      actions={<><a href="/catalog/media/library">Media Library</a><a href="/catalog/content">محتوای محصولات</a></>}
    />
    <SiteMediaManager view="slots"/>
  </AdminShell>;
}
