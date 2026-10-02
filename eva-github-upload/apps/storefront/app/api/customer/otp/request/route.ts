import { NextResponse } from 'next/server';

const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${apiBase}/api/v1/customer/auth/request-otp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json({ message: 'OTP service is unavailable' }, { status: 503 });
  }
}
