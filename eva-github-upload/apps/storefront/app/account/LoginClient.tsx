'use client';

import { FormEvent, useState } from 'react';
import styles from './account.module.css';

function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

function messageFrom(payload: any, fallback: string) {
  if (typeof payload?.message === 'string') return payload.message;
  if (Array.isArray(payload?.message)) return payload.message.join('، ');
  return fallback;
}

export default function LoginClient({ expired = false }: { expired?: boolean }) {
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [masked, setMasked] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(expired ? 'نشست قبلی منقضی شده؛ دوباره وارد شو.' : '');
  const [error, setError] = useState('');

  async function requestOtp(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    const normalized = latinDigits(mobile).replace(/\s/g, '');
    try {
      const response = await fetch('/api/customer/otp/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mobile: normalized }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(data, 'ارسال کد انجام نشد.'));
      setMobile(normalized);
      setMasked(data.mobileMasked ?? normalized);
      setStep('code');
      setNotice('کد ورود ایجاد شد. در نسخه نهایی همین کد با پیامک ارسال می‌شود.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ارسال کد انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const normalizedCode = latinDigits(code).replace(/\D/g, '');
    try {
      const response = await fetch('/api/customer/otp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mobile, code: normalizedCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(data, 'کد واردشده صحیح نیست.'));
      window.location.href = '/account';
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ورود انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.loginCard}>
      <span className={styles.eyebrow}>CUSTOMER ACCOUNT</span>
      <h1>حساب ایوا</h1>
      <p>با شماره موبایلی که سفارش را با آن ثبت کرده‌ای وارد شو.</p>

      {notice && <div className={styles.notice}>{notice}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {step === 'mobile' ? (
        <form onSubmit={requestOtp}>
          <label>
            شماره موبایل
            <input
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="۰۹۱۲..."
              required
            />
          </label>
          <button disabled={busy}>{busy ? 'در حال بررسی...' : 'دریافت کد ورود'}</button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <div className={styles.sentTo}>کد برای <b dir="ltr">{masked}</b></div>
          <label>
            کد ۶ رقمی
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              required
            />
          </label>
          <button disabled={busy}>{busy ? 'در حال ورود...' : 'ورود به حساب'}</button>
          <button
            className={styles.textButton}
            type="button"
            onClick={() => {
              setStep('mobile');
              setCode('');
              setError('');
              setNotice('');
            }}
          >
            تغییر شماره موبایل
          </button>
        </form>
      )}
    </section>
  );
}
