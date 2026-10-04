import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import NotificationsPanel from '../components/NotificationsPanel';
import { requireAdmin } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function NotificationsPage(){
  await requireAdmin();
  return <AdminShell>
    <AdminPageHeader eyebrow="COMMUNICATIONS" title="پیام‌ها" description="SMS Outbox، وضعیت ارسال و پیام‌های تست. Provider واقعی هنوز متصل نشده است."/>
    <NotificationsPanel/>
  </AdminShell>;
}
