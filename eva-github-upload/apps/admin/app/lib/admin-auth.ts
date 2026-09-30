import { createHash, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'eva_admin_session';

export function sessionValue() {
  const secret = process.env.ADMIN_API_KEY;
  if (!secret) return null;
  return createHash('sha256').update(`eva-admin:${secret}`).digest('hex');
}

export function passwordMatches(input: string) {
  const secret = process.env.ADMIN_API_KEY;
  if (!secret) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
