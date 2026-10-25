const SCRIPT_HASH = "'sha256-YC1y6SYBbJgtVjvCTt39zRXq8ckidsbf8VJkbACOzP4='";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  `script-src 'self' ${SCRIPT_HASH}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://img.vietqr.io",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
].join('; ');

export function securityHeaders(req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'same-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.set('Content-Security-Policy', CSP);
  res.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (req.secure) res.set('Strict-Transport-Security', 'max-age=15552000');
  next();
}

export function sameOriginState(req) {
  const host = req.get('host') || '';
  const expected = host ? `${req.protocol}://${host}` : '';
  const origin = req.get('origin');
  if (origin) return origin !== 'null' && origin === expected;
  const site = req.get('sec-fetch-site');
  if (site) return site === 'same-origin' || site === 'none';
  const referer = req.get('referer');
  if (!referer) return true;
  try {
    return new URL(referer).host === host;
  } catch {
    return false;
  }
}

const ADMIN_WRITE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function adminSameOrigin(req, res, next) {
  if (!ADMIN_WRITE.has(req.method) || !req.path.startsWith('/api/admin')) return next();
  if (sameOriginState(req)) return next();
  res.status(403).json({ error: 'Thao tác này chỉ nhận từ chính trang quản trị.' });
}
