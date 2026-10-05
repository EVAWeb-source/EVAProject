import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, sessionValue } from '../../../lib/admin-auth';

const API_BASE = process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';

export async function GET() {
  const expectedSession = sessionValue();
  const store = await cookies();
  const currentSession = store.get(ADMIN_SESSION_COOKIE)?.value;

  if (!expectedSession || currentSession !== expectedSession) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return new Response(JSON.stringify({ error: 'ADMIN_API_KEY is not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const upstream = await fetch(`${API_BASE}/api/v1/admin/backup/export`, {
    cache: 'no-store',
    headers: { 'x-admin-key': adminKey },
  });

  if (!upstream.ok || !upstream.body) {
    const message = await upstream.text().catch(() => 'Backup export failed');
    return new Response(message || 'Backup export failed', {
      status: upstream.status || 502,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const day = new Date().toISOString().slice(0, 10);
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="eva-backup-${day}.json"`,
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
    },
  });
}
