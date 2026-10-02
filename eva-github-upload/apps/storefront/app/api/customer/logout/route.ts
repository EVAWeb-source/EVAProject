import { NextRequest, NextResponse } from 'next/server';

const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';
const COOKIE_NAME = 'eva_customer_session';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    try {
      await fetch(`${apiBase}/api/v1/customer/auth/logout`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    } catch {}
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
