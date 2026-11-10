import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, test } from 'node:test';
import { contentSecurityPolicy } from './guard.js';
import {
  notifySheets,
  orderToSheetRow,
  postSheet,
  sampleSheetOrder,
  scrubSheets,
  sendTestNotifications,
  sheetsSettings,
} from './sheets.js';
import { aiHealthUrl, DEFAULT_AI_HEALTH_URL } from './warmup.js';

const order = {
  code: 'MQ261110-ABC123',
  createdAt: '2026-11-10T04:53:00.000Z',
  payMethod: 'vietqr',
  status: 'cho_ck',
  customer: {
    name: 'Nguyễn An',
    phone: '0909123456',
    address: '12 đường Mộc',
    ward: 'Phường 1',
    province: 'TP. Hồ Chí Minh',
    note: 'Giao buổi chiều',
  },
  items: [{ name: 'Xoài sấy', w: '100g', sku: 'MQ-X', qty: 2, price: 11111, line: 22222 }],
  gifts: [{ name: 'Quà thử', qty: 1, price: 0 }],
  summary: { subtotal: 290000, discount: 0, ship: 30000, total: 320000 },
};

const webhook = 'https://script.google.com/macros/s/deploy-id/exec';
const secret = 'sheet-secret-value';

describe('Google Sheet và đánh thức ai-server', { concurrency: 1 }, () => {
  test('dòng đơn lấy đúng field, giờ Việt Nam', () => {
    const row = orderToSheetRow(order);
    assert.deepEqual(Object.keys(row), [
      'time', 'code', 'name', 'phone', 'address', 'note', 'items',
      'subtotal', 'discount', 'ship', 'total', 'pay', 'status', 'mark',
    ]);
    assert.match(row.time, /11:53/);
    assert.equal(row.code, 'MQ261110-ABC123');
    assert.equal(row.name, 'Nguyễn An');
    assert.equal(row.phone, '0909123456');
    assert.equal(row.address, '12 đường Mộc, Phường 1, TP. Hồ Chí Minh');
    assert.equal(row.note, 'Giao buổi chiều');
    assert.match(row.items, /Xoài sấy · 100g · MQ-X · 2 · 11111/);
    assert.match(row.items, /Quà thử · 1 · 0/);
    assert.equal(row.subtotal, 290000);
    assert.equal(row.discount, 0);
    assert.equal(row.ship, 30000);
    assert.equal(row.total, 320000);
    assert.equal(row.pay, 'Chuyển khoản');
    assert.equal(row.status, 'Chờ CK');
    assert.equal(row.mark, '');
    const sample = orderToSheetRow(sampleSheetOrder(new Date('2026-11-10T04:53:00.000Z')), { test: true });
    assert.equal(sample.code, 'TEST');
    assert.equal(sample.mark, 'TEST');
    assert.match(sample.note, /TEST/);
    assert.match(sample.items, /TEST/);
  });

  test('thiếu URL thì không gọi mạng', async () => {
    const settings = sheetsSettings({ GOOGLE_SHEETS_WEBHOOK_URL: '', GOOGLE_SHEETS_SECRET: secret });
    assert.equal(settings.enabled, false);
    assert.equal(sheetsSettings({ GOOGLE_SHEETS_WEBHOOK_URL: 'không-phải-url' }).enabled, false);
    assert.equal(sheetsSettings({ GOOGLE_SHEETS_WEBHOOK_URL: webhook }).enabled, true);
    let called = false;
    const fetchImpl = async () => { called = true; throw new Error(webhook); };
    const skipped = await postSheet(order, { settings, fetchImpl });
    assert.deepEqual(skipped, { skipped: true, ok: false, status: 'unconfigured' });
    notifySheets(order, { settings, fetchImpl });
    assert.equal(called, false);
  });

  test('POST một lần khi Sheet nhận, có bí mật trong thân, không có trong log', async () => {
    const seen = [];
    const logs = [];
    const orig = console.error;
    console.error = (...args) => logs.push(args.join(' '));
    try {
      const result = await postSheet(order, {
        settings: { url: webhook, secret, enabled: true },
        fetchImpl: async (url, init) => {
          seen.push({ url, init });
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        },
      });
      assert.equal(result.status, 'ok');
      assert.equal(seen.length, 1);
      assert.equal(seen[0].url, webhook);
      assert.equal(seen[0].init.method, 'POST');
      assert.equal(seen[0].init.redirect, 'follow');
      const body = JSON.parse(seen[0].init.body);
      assert.equal(body.secret, secret);
      assert.equal(body.row.code, order.code);
      assert.equal(body.row.phone, '0909123456');
      assert.equal(logs.length, 0);
      assert.equal(JSON.stringify(body).includes(webhook), false);
    } finally {
      console.error = orig;
    }
  });

  test('lỗi mạng thì thử lại một lần, log không chứa URL hay bí mật', async () => {
    const logs = [];
    const orig = console.error;
    console.error = (...args) => logs.push(args.join(' '));
    let calls = 0;
    try {
      const result = await postSheet(order, {
        settings: { url: webhook, secret, enabled: true },
        timeoutMs: 30,
        fetchImpl: async () => {
          calls += 1;
          if (calls === 1) throw new Error(`failed ${webhook} token ${secret}`);
          return new Response(JSON.stringify({ ok: false, error: 'secret' }), { status: 200 });
        },
      });
      assert.equal(calls, 2);
      assert.equal(result.status, 'error');
      const text = logs.join('\n');
      assert.match(text, /<url>/);
      assert.match(text, /<secret>/);
      assert.equal(text.includes(secret), false);
      assert.equal(text.includes('deploy-id'), false);
      assert.equal(text.includes('script.google.com'), false);
      assert.equal(scrubSheets(new Error(`see ${webhook} and ${secret}`), { url: webhook, secret }).includes(secret), false);
    } finally {
      console.error = orig;
    }
  });

  test('hết giờ thì thử lại một lần rồi thành công', async () => {
    let calls = 0;
    const result = await postSheet(order, {
      settings: { url: webhook, secret: '', enabled: true },
      timeoutMs: 20,
      fetchImpl: (_url, init) => new Promise((resolve, reject) => {
        calls += 1;
        if (calls === 1) {
          init.signal.addEventListener('abort', () => reject(new Error(`aborted ${webhook}`)));
          return;
        }
        const body = JSON.parse(init.body);
        assert.equal(body.secret, undefined);
        assert.equal(body.row.pay, 'Chuyển khoản');
        resolve(new Response('{}', { status: 200 }));
      }),
    });
    assert.equal(calls, 2);
    assert.equal(result.status, 'ok');
  });

  test('nút thử báo từng kênh và dòng TEST', async () => {
    const seen = [];
    const report = await sendTestNotifications({
      telegramSettings: { token: '', chatIds: [], enabled: false },
      sheetsSettings: { url: webhook, secret, enabled: true },
      fetchImpl: async (_url, init) => {
        seen.push(JSON.parse(init.body));
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });
    assert.equal(report.telegram.status, 'unconfigured');
    assert.equal(report.sheets.status, 'ok');
    assert.equal(seen.length, 1);
    assert.equal(seen[0].row.mark, 'TEST');
    assert.equal(seen[0].row.code, 'TEST');
    assert.equal(seen[0].secret, secret);

    let telegramCalls = 0;
    const both = await sendTestNotifications({
      telegramSettings: { token: '999:SECRET', chatIds: ['111'], enabled: true },
      sheetsSettings: { url: '', secret: '', enabled: false },
      fetchImpl: async (url) => {
        telegramCalls += 1;
        assert.equal(String(url).includes('SECRET'), true);
        return new Response('{}', { status: 200 });
      },
    });
    assert.equal(both.telegram.status, 'ok');
    assert.equal(both.telegram.sent, 1);
    assert.equal(both.sheets.status, 'unconfigured');
    assert.equal(telegramCalls, 1);
  });

  test('URL đánh thức và CSP', () => {
    assert.equal(aiHealthUrl({}), DEFAULT_AI_HEALTH_URL);
    assert.equal(aiHealthUrl({ AI_SERVER_HEALTH_URL: '  ' }), DEFAULT_AI_HEALTH_URL);
    assert.equal(aiHealthUrl({ AI_SERVER_HEALTH_URL: 'https://ai.example.com/health' }), 'https://ai.example.com/health');
    assert.equal(aiHealthUrl({ AI_SERVER_HEALTH_URL: 'off' }), '');
    const csp = contentSecurityPolicy({});
    assert.match(csp, /connect-src 'self' https:\/\/ai-server-u9ob\.onrender\.com/);
    const custom = contentSecurityPolicy({ AI_SERVER_HEALTH_URL: 'https://ai.example.com/health' });
    assert.match(custom, /connect-src 'self' https:\/\/ai\.example\.com/);
    assert.doesNotMatch(custom, /ai-server-u9ob/);
    const off = contentSecurityPolicy({ AI_SERVER_HEALTH_URL: 'off' });
    assert.match(off, /connect-src 'self'/);
    assert.doesNotMatch(off, /ai-server-u9ob/);
  });

  test('script Apps Script có doPost, bí mật và tiêu đề cột', () => {
    const gs = fs.readFileSync(new URL('../docs/google-sheets-apps-script.gs', import.meta.url), 'utf8');
    assert.match(gs, /function doPost/);
    assert.match(gs, /function doGet/);
    assert.match(gs, /GOOGLE_SHEETS_SECRET/);
    assert.match(gs, /getLastRow\(\) === 0/);
    assert.match(gs, /appendRow/);
    for (const header of ['Thời gian', 'Mã đơn', 'Khách', 'Điện thoại', 'Địa chỉ', 'Ghi chú', 'Món', 'Tạm tính', 'Giảm', 'Phí giao', 'Tổng', 'Thanh toán', 'Trạng thái', 'Đánh dấu']) {
      assert.match(gs, new RegExp(header));
    }
    assert.doesNotMatch(gs, /sheet-secret-value|AIza|bot\d+:/);
  });

  test('đơn không chờ Sheet; nút thử không tạo thêm đơn', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocqua-sheets-'));
    const saved = {
      DB_PATH: process.env.DB_PATH,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      ADMIN_SECRET: process.env.ADMIN_SECRET,
      GOOGLE_SHEETS_WEBHOOK_URL: process.env.GOOGLE_SHEETS_WEBHOOK_URL,
      GOOGLE_SHEETS_SECRET: process.env.GOOGLE_SHEETS_SECRET,
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    };
    process.env.DB_PATH = path.join(dir, 'shop.sqlite');
    process.env.ADMIN_PASSWORD = 'test-pass-sheets';
    process.env.ADMIN_SECRET = 'test-secret-sheets';
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = webhook;
    process.env.GOOGLE_SHEETS_SECRET = secret;
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    const realFetch = globalThis.fetch;
    const sheetCalls = [];
    const logs = [];
    let release = () => {};
    const gate = new Promise((resolve) => { release = resolve; });
    const origErr = console.error;
    console.error = (...args) => {
      const line = args.map((part) => (part instanceof Error ? part.message : String(part))).join(' ');
      logs.push(line);
      origErr(...args);
    };
    globalThis.fetch = async (url, init) => {
      const target = String(url);
      if (target.startsWith('https://script.google.com')) {
        sheetCalls.push(JSON.parse(init.body));
        if (sheetCalls.length === 1) {
          await gate;
          throw new Error(`network ${target} ${secret}`);
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return realFetch(url, init);
    };

      let server;
    try {
      const { createApp } = await import('./index.js');
      const { getShopCatalog } = await import('./catalog.js');
      const app = createApp();
      server = app.listen(0, '127.0.0.1');
      if (!server.listening) await new Promise((resolve) => server.once('listening', resolve));
      const base = `http://127.0.0.1:${server.address().port}`;
      const shop = getShopCatalog();
      const variant = shop.products.flatMap((product) => product.variants).find((item) => item.price > 0 && item.sku);
      assert.ok(variant, 'cần một mã đang bán');

      const pending = realFetch(base + '/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: [{ sku: variant.sku, qty: 1 }],
          name: 'Nguyễn An',
          phone: '0909000111',
          province: shop.provinces[0],
          ward: 'Phường 1',
          address: '12 đường Mộc',
          note: 'gọi trước',
          pay: 'vietqr',
        }),
      });
      let failSlow;
      const res = await Promise.race([
        pending,
        new Promise((_, reject) => { failSlow = setTimeout(() => reject(new Error('đơn bị chặn bởi Sheet')), 8000); }),
      ]);
      clearTimeout(failSlow);
      const placed = await res.json();
      assert.equal(res.status, 201, JSON.stringify(placed));
      assert.equal(sheetCalls.length, 1);
      assert.equal(sheetCalls[0].secret, secret);
      assert.equal(sheetCalls[0].row.code, placed.code);
      assert.equal(sheetCalls[0].row.phone, '0909000111');
      assert.equal(sheetCalls[0].row.total, placed.total);
      assert.equal(sheetCalls[0].row.mark, '');
      assert.match(sheetCalls[0].row.items, new RegExp(variant.sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.equal(sheetCalls[0].row.pay, 'Chuyển khoản');
      assert.equal(sheetCalls[0].row.status, 'Chờ CK');

      release();
      const deadline = Date.now() + 2000;
      while (sheetCalls.length < 2 && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 15));
      }
      assert.equal(sheetCalls.length, 2);

      const login = await realFetch(base + '/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'test-pass-sheets' }),
      });
      assert.equal(login.status, 200);
      const cookie = (login.headers.getSetCookie?.() || [login.headers.get('set-cookie')]).find(Boolean).split(';')[0];
      const auth = { cookie, 'content-type': 'application/json' };
      const before = await (await realFetch(base + '/api/admin/orders', { headers: auth })).json();
      const anon = await realFetch(base + '/api/admin/telegram-test', { method: 'POST' });
      assert.equal(anon.status, 401);
      const trial = await realFetch(base + '/api/admin/telegram-test', { method: 'POST', headers: auth, body: '{}' });
      const report = await trial.json();
      assert.equal(trial.status, 200, JSON.stringify(report));
      assert.equal(report.telegram.status, 'unconfigured');
      assert.equal(report.sheets.status, 'ok');
      const testRow = sheetCalls.at(-1).row;
      assert.equal(testRow.code, 'TEST');
      assert.equal(testRow.mark, 'TEST');
      const after = await (await realFetch(base + '/api/admin/orders', { headers: auth })).json();
      assert.equal(after.orders.length, before.orders.length);
      assert.equal(after.orders.some((item) => item.code === 'TEST'), false);

      const text = logs.join('\n');
      assert.equal(text.includes(secret), false);
      assert.equal(text.includes('deploy-id'), false);
      assert.equal(text.includes('script.google.com'), false);
    } finally {
      globalThis.fetch = realFetch;
      console.error = origErr;
      release();
      if (server) await new Promise((resolve) => server.close(resolve));
      for (const [key, value] of Object.entries(saved)) {
        if (value == null) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
