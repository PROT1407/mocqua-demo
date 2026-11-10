import assert from 'node:assert/strict';
import test from 'node:test';
import { formatNewOrder, notifyNewOrder, scrubTelegram, sendTelegram, telegramSettings } from './telegram.js';

const order = {
  code: 'MQ261110-ABC123',
  createdAt: '2026-11-10T04:53:00.000Z',
  payMethod: 'vietqr',
  customer: {
    name: 'Nguyễn An',
    phone: '0909123456',
    address: '12 đường Mộc',
    ward: 'Phường 1',
    province: 'TP. Hồ Chí Minh',
    note: 'Giao buổi chiều',
  },
  items: [{ name: 'Xoài sấy thăng hoa', w: '100g', qty: 2, line: 290000 }],
  summary: { subtotal: 290000, discount: 0, discountPct: 0, ship: 30000, total: 320000 },
};

test('tin đơn mới có đủ mục, không chứa token', () => {
  const text = formatNewOrder(order);
  assert.match(text, /🛒 ĐƠN MỚI #MQ261110-ABC123/);
  assert.match(text, /11:53/);
  assert.match(text, /Nguyễn An/);
  assert.match(text, /0909123456/);
  assert.match(text, /12 đường Mộc, Phường 1, TP\. Hồ Chí Minh/);
  assert.match(text, /Giao buổi chiều/);
  assert.match(text, /Xoài sấy thăng hoa 100g × 2 = 290\.000đ/);
  assert.match(text, /Tạm tính: 290\.000đ/);
  assert.match(text, /Giảm: 0đ/);
  assert.match(text, /Phí giao: 30\.000đ/);
  assert.match(text, /TỔNG: 320\.000đ/);
  assert.match(text, /Thanh toán: Chuyển khoản/);
  assert.match(text, /https:\/\/mocqua\.onrender\.com\/admin/);
  assert.doesNotMatch(text, /bot\d+:/);
});

test('không có biến Telegram thì không gọi mạng', async () => {
  const settings = telegramSettings({ TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '' });
  assert.equal(settings.enabled, false);
  let called = false;
  const result = await sendTelegram('xin chào', {
    settings,
    fetchImpl: async () => { called = true; return new Response('{}', { status: 200 }); },
  });
  assert.deepEqual(result, { skipped: true, sent: 0 });
  assert.equal(called, false);
  notifyNewOrder(order, {
    settings,
    fetchImpl: async () => { called = true; throw new Error('https://api.telegram.org/bot999:SECRET/sendMessage'); },
  });
  assert.equal(called, false);
  assert.match(scrubTelegram(new Error('bot999:SECRET leaked')), /bot<hidden>/);
  assert.doesNotMatch(scrubTelegram(new Error('bot999:SECRET leaked')), /SECRET/);
});

test('gửi tới từng chat id, lỗi một id không làm vỡ id kia', async () => {
  const seen = [];
  const result = await sendTelegram('Đơn thử', {
    settings: { token: '999:SECRET', chatIds: ['111', '222'], enabled: true },
    fetchImpl: async (url, init) => {
      seen.push({ url, body: JSON.parse(init.body) });
      const chat = JSON.parse(init.body).chat_id;
      return new Response('{}', { status: chat === '111' ? 500 : 200 });
    },
  });
  assert.equal(result.sent, 1);
  assert.deepEqual(seen.map((call) => call.body.chat_id), ['111', '222']);
  assert.equal(seen[0].url.includes('SECRET'), true);
});
