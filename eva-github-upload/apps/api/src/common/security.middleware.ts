import { createHash, timingSafeEqual } from 'node:crypto';

type Bucket = { count: number; resetAt: number };
type RatePolicy = {
  name: string;
  windowMs: number;
  max: number;
  matches: (method: string, path: string) => boolean;
};

const buckets = new Map<string, Bucket>();

const policies: RatePolicy[] = [
  {
    name: 'otp-request',
    windowMs: 10 * 60 * 1000,
    max: 6,
    matches: (method, path) => method === 'POST' && path.endsWith('/customer/auth/request-otp'),
  },
  {
    name: 'otp-verify',
    windowMs: 10 * 60 * 1000,
    max: 20,
    matches: (method, path) => method === 'POST' && path.endsWith('/customer/auth/verify-otp'),
  },
  {
    name: 'tracking',
    windowMs: 10 * 60 * 1000,
    max: 30,
    matches: (method, path) => method === 'POST' && path.endsWith('/tracking'),
  },
  {
    name: 'checkout-write',
    windowMs: 5 * 60 * 1000,
    max: 30,
    matches: (method, path) =>
      method === 'POST' &&
      ['/reservations', '/orders', '/payments'].some((segment) => path.includes(segment)),
  },
  {
    name: 'admin',
    windowMs: 5 * 60 * 1000,
    max: 300,
    matches: (_method, path) => isAdminPath(path),
  },
];

function requestPath(req: any) {
  return String(req.originalUrl ?? req.url ?? '').split('?')[0] || '/';
}

function clientIp(req: any) {
  // Express calculates req.ip after the trusted-proxy setting in main.ts,
  // so prefer it over raw forwarded headers supplied by the caller.
  const trusted = String(req.ip ?? '').trim();
  if (trusted) return trusted.slice(0, 96);
  return String(req.socket?.remoteAddress ?? 'unknown').slice(0, 96);
}

function isAdminPath(path: string) {
  return /(?:^|\/)api\/v1\/admin(?:\/|$)/.test(path) || /(?:^|\/)admin(?:\/|$)/.test(path);
}

function isSensitivePath(path: string) {
  return [
    '/admin',
    '/customer',
    '/tracking',
    '/orders',
    '/payments',
    '/reservations',
    '/invoices',
  ].some((segment) => path.includes(segment));
}

function safeSecretEqual(provided: string, expected: string) {
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

function headerValue(value: unknown) {
  if (Array.isArray(value)) return String(value[0] ?? '');
  return typeof value === 'string' ? value : '';
}

function pruneExpired(now: number) {
  if (buckets.size < 2_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function enforceRateLimit(req: any, res: any, path: string) {
  const method = String(req.method ?? 'GET').toUpperCase();
  const policy = policies.find((item) => item.matches(method, path));
  if (!policy) return true;

  const now = Date.now();
  pruneExpired(now);
  const key = `${policy.name}:${clientIp(req)}`;
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + policy.windowMs }
    : { count: current.count + 1, resetAt: current.resetAt };
  buckets.set(key, bucket);

  res.setHeader('RateLimit-Limit', String(policy.max));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, policy.max - bucket.count)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count <= policy.max) return true;

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json({
    statusCode: 429,
    message: 'Too many requests. Please try again later.',
    retryAfterSeconds: retryAfter,
  });
  return false;
}

export function evaSecurityMiddleware(req: any, res: any, next: () => void) {
  const path = requestPath(req);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

  const forwardedProto = headerValue(req.headers?.['x-forwarded-proto']);
  if (process.env.NODE_ENV === 'production' || forwardedProto === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  }

  if (isSensitivePath(path)) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
  }

  if (String(req.method ?? '').toUpperCase() === 'OPTIONS') {
    next();
    return;
  }

  if (!enforceRateLimit(req, res, path)) return;

  if (isAdminPath(path)) {
    const expected = String(process.env.ADMIN_API_KEY ?? '');
    const provided = headerValue(req.headers?.['x-admin-key']);

    if (!expected) {
      res.status(503).json({ statusCode: 503, message: 'Admin security is not configured' });
      return;
    }

    if (!provided || !safeSecretEqual(provided, expected)) {
      res.status(401).json({ statusCode: 401, message: 'Admin access denied' });
      return;
    }
  }

  next();
}
