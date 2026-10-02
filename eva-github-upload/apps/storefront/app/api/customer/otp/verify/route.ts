import { NextResponse } from 'next/server';

const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';
const COOKIE_NAME = 'eva_customer_session';
const THIRTY_DAYS = 30 * 24 * 60 * 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${apiBase}/api/v1/customer/auth/verify-otp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json(data, { status: response.status });

    const result = NextResponse.json({ ok: true, mobile: data.mobile, expiresAt: data.expiresAt });
    result.cookies.set(COOKIE_NAME, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: THIRTY_DAYS,
    });
    return result;
  } catch {
    return NextResponse.json({ message: 'OTP verification is unavailable' }, { status: 503 });
  }
}
