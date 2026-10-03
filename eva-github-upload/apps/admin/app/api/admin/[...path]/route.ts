import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, sessionValue } from '../../../lib/admin-auth';

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const session = sessionValue();
  const cookieStore = await cookies();
  if (!session || cookieStore.get(ADMIN_SESSION_COOKIE)?.value !== session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await context.params;
  const allowed = [
    /^products$/,
    /^products\/[^/]+$/,
    /^products\/[^/]+\/content$/,
    /^units$/,
    /^units\/[^/]+$/,
    /^pricing\/config$/,
    /^fulfillment$/,
    /^orders\/[^/]+\/fulfillment$/,
    /^notifications$/,
    /^notifications\/test$/,
  ];
  const joined = path.join('/');
  if (!allowed.some((pattern) => pattern.test(joined))) {
    return NextResponse.json({ error: 'Unsupported admin action' }, { status: 404 });
  }

  const apiBase = process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json({ error: 'ADMIN_API_KEY is not configured' }, { status: 500 });
  }

  const body = ['POST', 'PATCH', 'PUT'].includes(request.method) ? await request.text() : undefined;
  const response = await fetch(`${apiBase}/api/v1/admin/${joined}`, {
    method: request.method,
    headers: {
      'x-admin-key': adminKey,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body,
    cache: 'no-store',
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
  });
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context);
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context);
}
