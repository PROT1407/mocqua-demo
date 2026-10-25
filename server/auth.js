import crypto from 'node:crypto';

const COOKIE = 'mq_admin';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
export const LOGIN_FAIL_MAX = 5;
export const LOGIN_FAIL_WINDOW_MS = 15 * 60 * 1000;
const MIN_PASSWORD = 10;

const BLOCKED_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'passw0rd',
  'admin', 'admin123', 'admin1234', 'administrator',
  '123456', '12345678', '123456789', '1234567890', '12345678901',
  'qwerty', 'qwerty123', 'qwerty1234',
  'mocqua', 'mocqua123', 'mocqua1234',
  'changeme', 'letmein', 'matkhau', 'matkhau123',
  '1111111111', '0000000000', 'abc1234567',
]);

const failures = new Map();

function secret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '';
}

export function passwordConfigured() {
  return !!process.env.ADMIN_PASSWORD;
}

export function adminPasswordIssue(password = process.env.ADMIN_PASSWORD ?? '') {
  if (!String(password).trim()) {
    return 'Chưa đặt ADMIN_PASSWORD. Thêm mật khẩu ít nhất 10 ký tự vào biến môi trường trên Render rồi chạy lại. Máy chủ không khởi động khi mật khẩu trống.';
  }
  const weak = password.length < MIN_PASSWORD
    || BLOCKED_PASSWORDS.has(String(password).toLowerCase())
    || /^(.)\1+$/.test(password)
    || /^\d+$/.test(password);
  if (weak) {
    return 'ADMIN_PASSWORD quá yếu. Dùng ít nhất 10 ký tự, không dùng toàn số và không dùng mật khẩu phổ biến (admin, password, 123456, mocqua…). Máy chủ không khởi động.';
  }
  return '';
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

function clientKey(req) {
  return req.ip || req.socket?.remoteAddress || 'local';
}

function recentFailures(key, now = Date.now()) {
  const recent = (failures.get(key) || []).filter((at) => now - at < LOGIN_FAIL_WINDOW_MS);
  if (recent.length) failures.set(key, recent);
  else failures.delete(key);
  return recent;
}

export function loginBlocked(req) {
  return recentFailures(clientKey(req)).length >= LOGIN_FAIL_MAX;
}

export function recordLoginFailure(req) {
  const key = clientKey(req);
  const recent = recentFailures(key);
  recent.push(Date.now());
  failures.set(key, recent);
}

export function clearLoginFailures(req) {
  failures.delete(clientKey(req));
}

export function resetLoginFailures() {
  failures.clear();
}

export function readCookie(req) {
  const raw = req.headers.cookie || '';
  const part = raw.split(/;\s*/).find((p) => p.startsWith(COOKIE + '='));
  return part ? decodeURIComponent(part.slice(COOKIE.length + 1)) : '';
}

export function isAdmin(req) {
  return verify(readCookie(req));
}

function requestIsSecure(req) {
  if (req.secure) return true;
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  return proto === 'https';
}

function cookieHeader(value, req, maxAge) {
  const parts = [
    `${COOKIE}=${value}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAge}`,
  ];
  if (requestIsSecure(req)) parts.push('Secure');
  return parts.join('; ');
}

export function loginCookie(req) {
  const token = sign({ exp: Date.now() + SESSION_TTL_SECONDS * 1000 });
  return cookieHeader(token, req, SESSION_TTL_SECONDS);
}

export function logoutCookie(req) {
  return cookieHeader('', req, 0);
}

export function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: 'Bạn cần đăng nhập.' });
}
