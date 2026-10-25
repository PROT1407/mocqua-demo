export function vnd(n) {
  const x = Math.round(Number(n) || 0);
  return x.toLocaleString('vi-VN') + 'đ';
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

export function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

export function problem(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}
