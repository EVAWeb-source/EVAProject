'use client';

import { FormEvent, useState } from 'react';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Login failed');
      }
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ورود انجام نشد.');
      setLoading(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="loginBrand">EVA <span>ADMIN</span></div>
        <span className="eyebrow">SECURE OPERATIONS</span>
        <h1>ورود به پنل مدیریت</h1>
        <p>برای ورود، همان کلید مدیریتی که در Railway برای EVA-ADMIN تعریف کردی وارد کن.</p>
        <form onSubmit={submit}>
          <label>رمز مدیریت
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {error && <p className="formError">{error}</p>}
          <button className="primaryButton" disabled={loading}>{loading ? 'در حال بررسی...' : 'ورود به پنل'}</button>
        </form>
        <small>پس از ورود، نشست امن تا ۷ روز در همین مرورگر معتبر می‌ماند.</small>
      </section>
    </main>
  );
}
