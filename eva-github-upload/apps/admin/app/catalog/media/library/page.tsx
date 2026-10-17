import AdminPageHeader from '../../../components/AdminPageHeader';
import AdminShell from '../../../components/AdminShell';
import SiteMediaManager from '../../../components/SiteMediaManager';
import { requireAdmin } from '../../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function MediaLibraryPage(){
  await requireAdmin();
  return <AdminShell>
    <AdminPageHeader
      eyebrow="رسانه‌ها"
      title="Media Library"
      description="آرشیو تمام فایل‌های تصویری EVA و مدیریت فایل‌های بدون استفاده."
      actions={<a href="/catalog/media">تصاویر سایت</a>}
    />
    <SiteMediaManager view="library"/>
  </AdminShell>;
}
