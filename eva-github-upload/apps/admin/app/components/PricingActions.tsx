'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  rate: null | { purity: number; tomanPerGram: number; source: string; rateVersion: string; observedAt: string };
  rule: null | { id: string; name: string; formulaVersion: string; makingPercent: number; profitPercent: number; taxPercent: number; updatedAt: string };
};

function toman(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value);
}

export default function PricingActions({ rate, rule }: Props) {
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
    const payload = {
      tomanPerGram: Number(data.get('tomanPerGram')),
      makingPercent: Number(data.get('makingPercent')),
      profitPercent: Number(data.get('profitPercent')),
      taxPercent: Number(data.get('taxPercent')),
    };

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
      setMessage(`تنظیمات جدید ذخیره شد و قیمت ${new Intl.NumberFormat('fa-IR').format(result.repricedUnits ?? 0)} Unit بروزرسانی شد.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'بروزرسانی قیمت انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pricingAdminBox">
      <div className="pricingAdminIntro">
        <div><span>PRICING CONTROL</span><h3>تنظیم موتور قیمت‌گذاری</h3></div>
        <p>این تنظیمات روی قیمت جاری Unitهای قابل‌فروش اعمال می‌شود. سفارش‌ها، رزروهای فعال و فاکتورهای قبلی تغییر نمی‌کنند.</p>
      </div>

      {(message || error) && <div className={error ? 'actionMessage actionError' : 'actionMessage'}>{error || message}</div>}

      <form className="pricingAdminForm" onSubmit={submit}>
        <label>
          نرخ طلای ۱۸ عیار / گرم (تومان)
          <input name="tomanPerGram" type="number" min="1" step="1" required defaultValue={rate?.tomanPerGram ?? 14000000} />
          <small>{rate ? `نسخه فعلی: ${rate.rateVersion}` : 'بدون نرخ فعلی'}</small>
        </label>
        <label>
          اجرت (%)
          <input name="makingPercent" type="number" min="0" max="100" step="0.001" required defaultValue={rule?.makingPercent ?? 12} />
        </label>
        <label>
          سود (%)
          <input name="profitPercent" type="number" min="0" max="100" step="0.001" required defaultValue={rule?.profitPercent ?? 7} />
        </label>
        <label>
          مالیات (%)
          <input name="taxPercent" type="number" min="0" max="100" step="0.001" required defaultValue={rule?.taxPercent ?? 10} />
        </label>
        <button className="primaryButton" disabled={busy}>{busy ? 'در حال بروزرسانی...' : 'ثبت نرخ و فرمول جدید'}</button>
      </form>

      <div className="pricingCurrentLine">
        <span>نرخ فعلی</span><strong>{rate ? `${toman(rate.tomanPerGram)} تومان` : '—'}</strong>
        <span>Formula</span><strong dir="ltr">{rule?.formulaVersion ?? '—'}</strong>
      </div>
    </div>
  );
}
