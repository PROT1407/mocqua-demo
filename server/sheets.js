// Bản sao đơn sang Google Sheet. Thiếu GOOGLE_SHEETS_WEBHOOK_URL thì bỏ qua.
// Gửi sau khi đơn đã lưu. Lỗi mạng không làm hỏng đơn, không ghi URL hay bí mật ra log.

import { sampleTelegramText, sendTelegram, telegramSettings } from './telegram.js';

const TIMEOUT_MS = 10_000;

const PAY = {
  cod: 'Khi nhận hàng',
  vietqr: 'Chuyển khoản',
  test: 'Thử',
};

const STATUS = {
  cho_ck: 'Chờ CK',
  da_nhan: 'Đã nhận',
  dang_giao: 'Đang giao',
  xong: 'Xong',
  test: 'TEST',
};

export function sheetsSettings(env = process.env) {
  const url = String(env.GOOGLE_SHEETS_WEBHOOK_URL || '').trim();
  const secret = String(env.GOOGLE_SHEETS_SECRET || '').trim();
  let enabled = false;
  try {
    const parsed = new URL(url);
    enabled = parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    enabled = false;
  }
  return { url: enabled ? url : '', secret, enabled };
}

export function scrubSheets(error, { secret = '', url = '' } = {}) {
  let text = String(error?.message || error || 'error');
  const hidden = [url, secret].map((value) => String(value || '').trim()).filter((value) => value.length >= 4);
  for (const value of hidden) text = text.split(value).join(value === url ? '<url>' : '<secret>');
  text = text.replace(/https?:\/\/[^\s'"]+/gi, '<url>');
  return text.slice(0, 240);
}

function amount(value) {
  if (value == null || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? n : '';
}

function itemText(item) {
  const parts = [item?.name, item?.w || item?.variant || item?.label, item?.sku]
    .map((part) => String(part || '').trim())
    .filter(Boolean);
  if (item?.qty != null && item.qty !== '') parts.push(String(item.qty));
  const price = item?.price ?? item?.line;
  if (price != null && price !== '') parts.push(String(price));
  return parts.join(' · ');
}

export function sheetTime(value = Date.now()) {
  return new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
  });
}

export function orderToSheetRow(order, { test = false } = {}) {
  const customer = order?.customer || {};
  const summary = order?.summary || {};
  const address = [customer.address, customer.ward, customer.province].filter(Boolean).join(', ');
  const items = [...(order?.items || []), ...(order?.gifts || [])].map(itemText).filter(Boolean).join('\n');
  const marked = Boolean(test || order?.test || order?.code === 'TEST');
  return {
    time: sheetTime(order?.createdAt || Date.now()),
    code: String(order?.code || order?.id || ''),
    name: String(customer.name || ''),
    phone: String(customer.phone || ''),
    address,
    note: String(customer.note || order?.note || ''),
    items,
    subtotal: amount(summary.subtotal),
    discount: amount(summary.discount),
    ship: amount(summary.ship ?? summary.shipping),
    total: amount(summary.total),
    pay: PAY[order?.payMethod] || String(order?.payMethod || ''),
    status: STATUS[order?.status] || String(order?.status || ''),
    mark: marked ? 'TEST' : '',
  };
}

export function sampleSheetOrder(now = new Date()) {
  return {
    code: 'TEST',
    id: 'TEST',
    test: true,
    status: 'test',
    payMethod: 'test',
    createdAt: now.toISOString(),
    customer: {
      name: 'THỬ NGHIỆM',
      phone: '',
      address: '',
      note: 'Dòng TEST từ trang quản trị. Không phải đơn hàng.',
    },
    items: [{ name: 'TEST', sku: 'TEST', qty: 0, price: 0 }],
    summary: { subtotal: 0, discount: 0, ship: 0, total: 0 },
    note: 'Dòng TEST từ trang quản trị. Không phải đơn hàng.',
  };
}

function payloadFor(order, settings, test) {
  const body = { row: orderToSheetRow(order, { test: test || order?.test }) };
  if (settings.secret) body.secret = settings.secret;
  return body;
}

async function postOnce(url, body, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readJson(response) {
  const type = response.headers.get('content-type') || '';
  let text = '';
  try {
    text = await response.text();
  } catch {
    return { ok: false };
  }
  const trimmed = text.trim();
  if (!type.includes('json') && !trimmed.startsWith('{')) return { ok: false };
  try {
    return JSON.parse(trimmed);
  } catch {
    return { ok: false };
  }
}

export async function postSheet(order, {
  fetchImpl = globalThis.fetch,
  settings = sheetsSettings(),
  timeoutMs = TIMEOUT_MS,
  test = false,
} = {}) {
  if (!settings.enabled) return { skipped: true, ok: false, status: 'unconfigured' };
  const body = payloadFor(order, settings, test);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await postOnce(settings.url, body, fetchImpl, timeoutMs);
      const data = await readJson(response);
      if (response.ok && data.ok !== false) return { skipped: false, ok: true, status: 'ok' };
      console.error('sheets', response.ok ? 'rejected' : `http ${response.status}`);
    } catch (error) {
      console.error('sheets', scrubSheets(error, settings));
    }
  }
  return { skipped: false, ok: false, status: 'error' };
}

export function notifySheets(order, deps = {}) {
  try {
    const settings = deps.settings || sheetsSettings();
    if (!settings.enabled) return;
    postSheet(order, { ...deps, settings }).catch((error) => {
      console.error('sheets', scrubSheets(error, settings));
    });
  } catch (error) {
    console.error('sheets', scrubSheets(error, deps.settings || {}));
  }
}

export async function sendTestNotifications(deps = {}) {
  const tgSettings = deps.telegramSettings || telegramSettings();
  let telegram = { status: 'unconfigured', sent: 0 };
  if (tgSettings.enabled) {
    try {
      const result = await sendTelegram(sampleTelegramText(), { ...deps, settings: tgSettings });
      telegram = result.sent ? { status: 'ok', sent: result.sent } : { status: 'error', sent: 0 };
    } catch (error) {
      console.error('telegram', String(error?.message || 'error').replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot<hidden>'));
      telegram = { status: 'error', sent: 0 };
    }
  }

  const shSettings = deps.sheetsSettings || sheetsSettings();
  let sheets = { status: 'unconfigured' };
  if (shSettings.enabled) {
    const result = await postSheet(sampleSheetOrder(deps.now ? new Date(deps.now) : new Date()), {
      fetchImpl: deps.fetchImpl,
      settings: shSettings,
      timeoutMs: deps.timeoutMs,
      test: true,
    });
    sheets = { status: result.ok ? 'ok' : 'error' };
  }

  return { ok: true, telegram, sheets };
}
