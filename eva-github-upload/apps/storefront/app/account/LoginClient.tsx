'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './account.module.css';

function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

function messageFrom(payload: any, fallback: string) {
  const value = Array.isArray(payload?.message) ? payload.message.join('، ') : payload?.message;
  if (typeof value !== 'string') return fallback;
  if (value.includes('valid Iranian mobile')) return 'شماره موبایل معتبر وارد کن.';
  if (value.includes('configured test mobile')) return 'در محیط تست، ورود فقط با شماره تست فعال انجام می‌شود.';
  if (value.includes('wait before requesting')) return 'برای دریافت دوباره کد کمی صبر کن.';
  if (value.includes('exactly 6 digits')) return 'کد ورود باید ۶ رقم باشد.';
  if (value.includes('invalid or expired')) return 'کد ورود نامعتبر یا منقضی شده است.';
  if (value.includes('incorrect')) return 'کد واردشده صحیح نیست.';
  if (value.includes('Too many OTP')) return 'تعداد تلاش‌ها زیاد شده؛ کمی بعد دوباره امتحان کن.';
  return value || fallback;
}

export default function LoginClient({ expired = false }: { expired?: boolean }) {
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [masked, setMasked] = useState('');
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [notice, setNotice] = useState(expired ? 'نشست قبلی منقضی شده؛ دوباره وارد حساب شو.' : '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => setCountdown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  async function sendOtp(value: string) {
    const response = await fetch('/api/customer/otp/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mobile: value }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (Number(data.retryAfterSeconds) > 0) setCountdown(Number(data.retryAfterSeconds));
      throw new Error(messageFrom(data, 'ارسال کد انجام نشد.'));
    }
    setMasked(data.mobileMasked ?? value);
    setCountdown(Number(data.resendAfterSeconds) || 45);
    setNotice('کد ورود آماده شد. در نسخه نهایی همین مرحله از طریق پیامک انجام می‌شود.');
  }

  async function requestOtp(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const normalized = latinDigits(mobile).replace(/\D/g, '');
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await sendOtp(normalized);
      setMobile(normalized);
      setStep('code');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ارسال کد انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    if (busy || countdown > 0) return;
    setBusy(true);
    setError('');
    try {
      await sendOtp(mobile);
      setCode('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ارسال دوباره کد انجام نشد.');
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
      <div className={styles.loginCardHead}>
        <span className={styles.eyebrow}>CUSTOMER LOGIN</span>
        <h2>{step === 'mobile' ? 'ورود به حساب' : 'تأیید شماره'}</h2>
        <p>{step === 'mobile' ? 'شماره موبایلی که با آن خرید می‌کنی را وارد کن.' : <>کد ۶ رقمی مربوط به <b dir="ltr">{masked}</b> را وارد کن.</>}</p>
      </div>

      {notice && <div className={styles.notice}>{notice}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {step === 'mobile' ? (
        <form onSubmit={requestOtp}>
          <label>
            <span>شماره موبایل</span>
            <input
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="09xxxxxxxxx"
              required
            />
          </label>
          <button className={styles.primaryLoginButton} disabled={busy}>{busy ? 'در حال بررسی...' : 'دریافت کد ورود'}</button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <label>
            <span>کد ورود</span>
            <input
              className={styles.codeInput}
              value={code}
              onChange={(event) => setCode(latinDigits(event.target.value).replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              maxLength={6}
              placeholder="------"
              required
            />
          </label>
          <button className={styles.primaryLoginButton} disabled={busy || code.length !== 6}>{busy ? 'در حال ورود...' : 'ورود به حساب'}</button>
          <div className={styles.loginSecondaryActions}>
            <button className={styles.textButton} type="button" onClick={resendOtp} disabled={busy || countdown > 0}>
              {countdown > 0 ? `ارسال مجدد تا ${new Intl.NumberFormat('fa-IR').format(countdown)} ثانیه` : 'ارسال دوباره کد'}
            </button>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => {
                setStep('mobile');
                setCode('');
                setError('');
                setNotice('');
                setCountdown(0);
              }}
            >
              تغییر شماره
            </button>
          </div>
        </form>
      )}

      <small className={styles.loginFootnote}>ورود به حساب فقط برای مشاهده و پیگیری سفارش‌های مرتبط با همین شماره است.</small>
    </section>
  );
}
