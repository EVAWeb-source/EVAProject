import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, passwordMatches, sessionValue } from '../../lib/admin-auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = String(body.password ?? '');
  const session = sessionValue();

  if (!session) {
    return NextResponse.json({ error: 'ADMIN_API_KEY is not configured' }, { status: 500 });
  }
  if (!passwordMatches(password)) {
    return NextResponse.json({ error: 'رمز مدیریت نادرست است.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, session, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
