'use client';

import { useState } from 'react';
import styles from './backup.module.css';

type BackupFile = {
  manifest?: {
    format?: string;
    formatVersion?: number;
    schemaVersion?: string;
    checksumAlgorithm?: string;
    checksumSha256?: string;
    counts?: Record<string, number>;
    excludedForSecurity?: string[];
    containsPersonalData?: boolean;
    restorePolicy?: string;
  };
  data?: Record<string, unknown[]>;
};

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function BackupValidator() {
  const [state, setState] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('فایل Backup را انتخاب کن؛ بررسی فقط داخل همین مرورگر انجام می‌شود.');

  async function validate(file?: File) {
    if (!file) return;
    setState('checking');
    setMessage('در حال بررسی ساختار و Checksum...');

    try {
      const parsed = JSON.parse(await file.text()) as BackupFile;
      if (!parsed.manifest || !parsed.data) throw new Error('ساختار فایل Backup معتبر نیست.');
      if (parsed.manifest.format !== 'EVA_BUSINESS_BACKUP') throw new Error('فرمت فایل متعلق به Backup عملیاتی EVA نیست.');
      if (parsed.manifest.formatVersion !== 1) throw new Error('نسخه فرمت Backup پشتیبانی نمی‌شود.');
      if (parsed.manifest.checksumAlgorithm !== 'SHA-256' || !parsed.manifest.checksumSha256) {
        throw new Error('Checksum معتبر در Manifest وجود ندارد.');
      }

      const payload = JSON.stringify(parsed.data);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
      const calculated = hex(digest);
      if (calculated !== parsed.manifest.checksumSha256) {
        throw new Error('Checksum تطابق ندارد؛ فایل ناقص یا تغییرکرده است.');
      }

      const counts = parsed.manifest.counts ?? {};
      for (const [table, expected] of Object.entries(counts)) {
        const rows = parsed.data[table];
        if (!Array.isArray(rows) || rows.length !== expected) {
          throw new Error(`تعداد رکوردهای ${table} با Manifest تطابق ندارد.`);
        }
      }

      if ('OtpChallenge' in parsed.data || 'CustomerSession' in parsed.data) {
        throw new Error('فایل شامل داده‌های امنیتی‌ای است که نباید داخل Backup باشند.');
      }

      setState('ok');
      setMessage(`Backup سالم است. SHA-256 تأیید شد و ${Object.keys(counts).length} جدول بررسی شد.`);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'بررسی فایل Backup ناموفق بود.');
    }
  }

  return <section className={styles.validator}>
    <div>
      <span className={styles.eyebrow}>LOCAL INTEGRITY CHECK</span>
      <h2>بررسی سلامت Backup</h2>
      <p>فایل فقط در مرورگر خودت خوانده می‌شود و برای بررسی به سرور یا ChatGPT ارسال نمی‌شود.</p>
    </div>
    <label className={styles.filePicker}>
      <input type="file" accept="application/json,.json" onChange={(event) => validate(event.target.files?.[0])} />
      انتخاب فایل Backup
    </label>
    <div className={`${styles.validationResult} ${styles[state]}`} role="status" aria-live="polite">{message}</div>
  </section>;
}
