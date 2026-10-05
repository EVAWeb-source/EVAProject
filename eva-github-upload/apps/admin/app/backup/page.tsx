import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import { API_BASE, faNumber, requireAdmin } from '../lib/admin-data';
import BackupValidator from './BackupValidator';
import styles from './backup.module.css';

export const dynamic = 'force-dynamic';

type BackupStatus = {
  generatedAt: string;
  format: string;
  formatVersion: number;
  schemaVersion: string;
  counts: Record<string, number>;
  excludedForSecurity: string[];
  restorePolicy: string;
};

async function loadBackupStatus(): Promise<{data:BackupStatus|null;error:string|null}> {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return { data:null, error:'ADMIN_API_KEY برای پنل تنظیم نشده است.' };
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/backup/status`, {
      cache:'no-store',
      headers:{ 'x-admin-key':adminKey },
    });
    if (!response.ok) return { data:null, error:`API Backup پاسخ ${response.status} داد.` };
    return { data:await response.json(), error:null };
  } catch {
    return { data:null, error:'اتصال به سرویس Backup برقرار نشد.' };
  }
}

export default async function BackupPage(){
  await requireAdmin();
  const {data,error}=await loadBackupStatus();
  const count=(key:string)=>faNumber(data?.counts?.[key] ?? 0);

  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="BACKUP & RECOVERY" title="نسخه پشتیبان و بازیابی" description="نسخه ثانویه از داده‌های حیاتی EVA برای بازیابی در شرایط اضطراری. Restore مستقیم روی Production عمداً غیرفعال است."/>

    {error||!data?<section className="setupCard"><h1>وضعیت Backup قابل دریافت نیست.</h1><p>{error}</p></section>:<>
      <section className="notificationSummary">
        <article><span>سفارش‌ها</span><b>{count('Order')}</b></article>
        <article><span>مشتری‌ها</span><b>{count('Customer')}</b></article>
        <article><span>Unitها</span><b>{count('PhysicalUnit')}</b></article>
        <article><span>فاکتورها</span><b>{count('Invoice')}</b></article>
      </section>

      <section className={styles.grid}>
        <article className={styles.primaryCard}>
          <span className={styles.eyebrow}>SECONDARY SNAPSHOT</span>
          <h2>دانلود Backup عملیاتی EVA</h2>
          <p>محصولات، Unitها، مشتری‌ها، سفارش‌ها، پرداخت‌ها، فاکتورها، مرجوعی‌ها، قیمت‌گذاری، پیام‌ها و Audit Log داخل فایل قرار می‌گیرند.</p>
          <a className={styles.download} href="/api/backup/export">دانلود فایل Backup</a>
          <small>فایل شامل اطلاعات شخصی مشتریان است؛ آن را فقط در فضای امن نگهداری کن.</small>
        </article>

        <article className={styles.infoCard}>
          <span>سیاست امنیتی</span>
          <h3>OTP و Session ذخیره نمی‌شوند</h3>
          <p>Challengeهای OTP و Session Tokenها عمداً از Backup حذف شده‌اند. Secretهای Railway هم هیچ‌وقت داخل فایل قرار نمی‌گیرند.</p>
        </article>

        <article className={styles.infoCard}>
          <span>Restore Policy</span>
          <h3>فقط روی دیتابیس خالی</h3>
          <p>اسکریپت بازیابی به‌صورت پیش‌فرض اگر در دیتابیس مقصد داده‌ای وجود داشته باشد متوقف می‌شود تا Production تصادفی overwrite نشود.</p>
        </article>

        <article className={styles.infoCard}>
          <span>Integrity</span>
          <h3>Checksum داخلی SHA-256</h3>
          <p>هر Backup یک Checksum دارد تا قبل از Restore مشخص شود فایل ناقص یا تغییرکرده نیست.</p>
        </article>
      </section>

      <BackupValidator />

      <section className={styles.meta}>
        <div><span>Schema Version</span><code>{data.schemaVersion}</code></div>
        <div><span>Backup Format</span><code>{data.format} v{data.formatVersion}</code></div>
        <div><span>Audit Records</span><b>{count('AdminAuditLog')}</b></div>
        <div><span>After-Sales Cases</span><b>{count('AfterSalesCase')}</b></div>
      </section>
    </>}
  </AdminShell>;
}
