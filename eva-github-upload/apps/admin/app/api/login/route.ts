import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, passwordMatches, sessionValue } from '../../lib/admin-auth';

type LoginBucket = { count:number; resetAt:number };
const attempts = new Map<string, LoginBucket>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;

function clientIp(request:Request){
  const real=request.headers.get('x-real-ip')?.trim();
  if(real)return real.slice(0,96);
  const forwarded=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (forwarded||'unknown').slice(0,96);
}

function withSecurityHeaders(response:NextResponse){
  response.headers.set('Cache-Control','no-store, max-age=0');
  response.headers.set('Pragma','no-cache');
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('X-Frame-Options','DENY');
  response.headers.set('Referrer-Policy','no-referrer');
  return response;
}

function blockedResponse(bucket:LoginBucket){
  const retryAfter=Math.max(1,Math.ceil((bucket.resetAt-Date.now())/1000));
  const response=NextResponse.json(
    {error:'تعداد تلاش‌های ورود بیش از حد مجاز است. کمی بعد دوباره تلاش کن.',retryAfterSeconds:retryAfter},
    {status:429},
  );
  response.headers.set('Retry-After',String(retryAfter));
  return withSecurityHeaders(response);
}

export async function POST(request: Request) {
  const ip=clientIp(request);
  const now=Date.now();
  const current=attempts.get(ip);
  if(current&&current.resetAt>now&&current.count>=MAX_LOGIN_ATTEMPTS)return blockedResponse(current);
  if(current&&current.resetAt<=now)attempts.delete(ip);

  const body = await request.json().catch(() => ({}));
  const password = String(body.password ?? '');
  const session = sessionValue();

  if (!session) {
    return withSecurityHeaders(NextResponse.json({ error: 'امنیت پنل هنوز پیکربندی نشده است.' }, { status: 503 }));
  }

  if (!passwordMatches(password)) {
    const previous=attempts.get(ip);
    const bucket:LoginBucket=previous&&previous.resetAt>now
      ?{count:previous.count+1,resetAt:previous.resetAt}
      :{count:1,resetAt:now+LOGIN_WINDOW_MS};
    attempts.set(ip,bucket);
    if(bucket.count>=MAX_LOGIN_ATTEMPTS)return blockedResponse(bucket);
    return withSecurityHeaders(NextResponse.json({ error: 'رمز مدیریت نادرست است.' }, { status: 401 }));
  }

  attempts.delete(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, session, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return withSecurityHeaders(response);
}
