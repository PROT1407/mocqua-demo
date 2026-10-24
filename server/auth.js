import crypto from 'node:crypto';

const COOKIE = 'mq_admin';
const WEEK = 14 * 24 * 60 * 60;

function secret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '';
}

export function passwordConfigured() {
  return !!process.env.ADMIN_PASSWORD;
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || !secret()) return false;
  const a = crypto.createHash('sha256').update(String(input)).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || !secret()) return false;
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return false;
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function readCookie(req) {
  const raw = req.headers.cookie || '';
  const part = raw.split(/;\s*/).find((p) => p.startsWith(COOKIE + '='));
  return part ? decodeURIComponent(part.slice(COOKIE.length + 1)) : '';
}

export function isAdmin(req) {
  return verify(readCookie(req));
}

export function loginCookie(req) {
  const token = sign({ exp: Date.now() + WEEK * 1000 });
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${WEEK}${secure ? '; Secure' : ''}`;
}

export function logoutCookie(req) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: 'Bạn cần đăng nhập.' });
}
