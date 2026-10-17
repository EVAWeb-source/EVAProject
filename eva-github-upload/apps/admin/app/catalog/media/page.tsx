import AdminPageHeader from '../../components/AdminPageHeader';
import AdminShell from '../../components/AdminShell';
import HomeContentManager from '../../components/HomeContentManager';
import SiteMediaManager from '../../components/SiteMediaManager';
import { requireAdmin } from '../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function CatalogMediaPage(){
  await requireAdmin();
  return <AdminShell>
    <AdminPageHeader
      eyebrow="رسانه‌ها"
      title="تصاویر و محتوای صفحه اصلی"
      description="متن‌های Hero و داستان EVA، تصویرهای صفحه اصلی و Crop هر جایگاه را از همین بخش مدیریت کن."
      actions={<><a href="/catalog/media/library">Media Library</a><a href="/catalog/content">محتوای محصولات</a></>}
    />
    <HomeContentManager/>
    <SiteMediaManager view="slots"/>
  </AdminShell>;
}
