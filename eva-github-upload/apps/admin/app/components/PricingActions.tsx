'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  rate: null | { purity: number; tomanPerGram: number; source: string; rateVersion: string; observedAt: string };
};

function toman(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value);
}

export default function PricingActions({ rate }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    setError('');

    const data = new FormData(event.currentTarget);
    const payload = { tomanPerGram: Number(data.get('tomanPerGram')) };

    try {
      const response = await fetch('/api/admin/pricing/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
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
      setMessage(`نرخ طلا ذخیره شد و قیمت ${new Intl.NumberFormat('fa-IR').format(result.repricedUnits ?? 0)} Unit قابل‌فروش با درصدهای اختصاصی خودشان بروزرسانی شد.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'بروزرسانی نرخ طلا انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pricingAdminBox">
      <div className="pricingAdminIntro">
        <div><span>GOLD RATE</span><h3>نرخ سراسری طلا</h3></div>
        <p>فقط نرخ هر گرم طلا در این بخش مشترک است. اجرت، سود و مالیات داخل هر محصول مدیریت می‌شوند. Snapshot سفارش‌ها و فاکتورهای قبلی دست‌نخورده می‌مانند.</p>
      </div>

      {(message || error) && <div className={error ? 'actionMessage actionError' : 'actionMessage'}>{error || message}</div>}

      <form className="pricingAdminForm" onSubmit={submit}>
        <label>
          نرخ طلای ۱۸ عیار / گرم (تومان)
          <input name="tomanPerGram" type="number" min="1" step="1" required defaultValue={rate?.tomanPerGram ?? 14000000} />
          <small>{rate ? `منبع: ${rate.source} • نسخه: ${rate.rateVersion}` : 'بدون نرخ فعلی'}</small>
        </label>
        <button className="primaryButton" disabled={busy}>{busy ? 'در حال بروزرسانی...' : 'ثبت نرخ جدید طلا'}</button>
      </form>

      <div className="pricingCurrentLine">
        <span>نرخ فعلی</span><strong>{rate ? `${toman(rate.tomanPerGram)} تومان` : '—'}</strong>
        <span>منبع</span><strong dir="ltr">{rate?.source ?? '—'}</strong>
      </div>
    </div>
  );
}
