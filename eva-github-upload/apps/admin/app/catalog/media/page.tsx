import AdminPageHeader from '../../components/AdminPageHeader';
import AdminShell from '../../components/AdminShell';
import SiteMediaManager from '../../components/SiteMediaManager';
import { requireAdmin } from '../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function CatalogMediaPage(){
  await requireAdmin();
  return <AdminShell>
    <AdminPageHeader
      eyebrow="کاتالوگ"
      title="رسانه‌های EVA"
      description="آپلود و مدیریت تصاویر Hero، بخش داستان و کارت‌های کالکشن بدون نیاز به ویرایش کد."
      actions={<><a href="/catalog/content">محتوای محصولات</a><a href="/catalog">محصولات</a></>}
    />
    <SiteMediaManager/>
  </AdminShell>;
}
