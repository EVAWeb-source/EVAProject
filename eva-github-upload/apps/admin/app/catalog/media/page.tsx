import AdminPageHeader from '../../components/AdminPageHeader';
import AdminShell from '../../components/AdminShell';
import MediaWorkspace from '../../components/MediaWorkspace';
import { requireAdmin } from '../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function CatalogMediaPage(){
  await requireAdmin();
  return <AdminShell>
    <AdminPageHeader
      eyebrow="رسانه‌ها"
      title="مدیریت رسانه‌ها"
      description="تصاویر و متن‌های صفحه اصلی را از دو تب مجزا مدیریت کن."
      actions={<><a href="/catalog/media/library">Media Library</a><a href="/catalog/content">محتوای محصولات</a></>}
    />
    <MediaWorkspace/>
  </AdminShell>;
}
