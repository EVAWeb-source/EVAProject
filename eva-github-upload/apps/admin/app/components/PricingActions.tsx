'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './PricingActions.module.css';

type Props = {
  rate: null | { purity: number; tomanPerGram: number; source: string; rateVersion: string; observedAt: string };
};

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

function rawNumber(value: string) {
  return toEnglishDigits(value).replace(/[^0-9]/g, '');
}

function separated(value: string | number) {
  const digits = rawNumber(String(value));
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

export default function PricingActions({ rate }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rateInput, setRateInput] = useState(() => separated(rate?.tomanPerGram ?? 14000000));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const tomanPerGram = Number(rawNumber(rateInput));
    if (!Number.isFinite(tomanPerGram) || tomanPerGram <= 0) {
      setError('نرخ طلا را به‌صورت عدد معتبر وارد کن.');
      return;
    }

    setBusy(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/pricing/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tomanPerGram }),
      });
      const raw = await response.text();
      if (!response.ok) {
        try {
          const parsed = JSON.parse(raw);
          throw new Error(Array.isArray(parsed.message) ? parsed.message.join('، ') : (parsed.message || parsed.error));
        } catch (err) {
          if (err instanceof Error && err.message) throw err;
          throw new Error(raw || `HTTP ${response.status}`);
        }
      }
      const result = JSON.parse(raw);
      setMessage(`نرخ ذخیره شد و قیمت ${new Intl.NumberFormat('fa-IR').format(result.repricedUnits ?? 0)} Unit قابل‌فروش بروزرسانی شد.`);
      setRateInput(separated(tomanPerGram));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'بروزرسانی نرخ طلا انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.box}>
      <div className={styles.intro}>
        <div>
          <h3>ثبت نرخ دستی</h3>
          <p>تا زمان اتصال API قیمت طلا، نرخ هر گرم طلای ۱۸ عیار را از اینجا ثبت کن. اجرت، سود و مالیات هر محصول مستقل باقی می‌ماند.</p>
        </div>
      </div>

      {(message || error) && <div className={`${styles.message} ${error ? styles.error : ''}`}>{error || message}</div>}

      <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>
          نرخ طلای ۱۸ عیار / گرم
          <div className={styles.inputWrap}>
            <input
              className={styles.input}
              name="tomanPerGramDisplay"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              required
              value={rateInput}
              onChange={(event) => setRateInput(separated(event.target.value))}
              aria-label="نرخ طلای ۱۸ عیار به تومان"
            />
            <span className={styles.suffix}>تومان</span>
          </div>
          <small>{rate ? `منبع فعلی: ${rate.source}` : 'هنوز نرخ فعالی ثبت نشده است.'}</small>
        </label>
        <button className={styles.button} disabled={busy}>{busy ? 'در حال ثبت...' : 'ثبت نرخ جدید'}</button>
      </form>

      <div className={styles.foot}><span className={styles.dot}/><span>با ثبت نرخ جدید، فقط Unitهای قابل‌فروش دوباره قیمت‌گذاری می‌شوند.</span></div>
    </div>
  );
}
