import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocqua-gift-'));
process.env.DB_PATH = path.join(dir, 'shop.sqlite');
process.env.ADMIN_PASSWORD = 'test-pass';
process.env.ADMIN_SECRET = 'test-secret';
process.env.BANK_BIN = '000000';
process.env.BANK_NAME = 'Ngan hang thu';
process.env.ACCOUNT_NO = '0000000000';
process.env.ACCOUNT_NAME = 'MOC QUA TEST';
delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;
delete process.env.GOOGLE_SHEETS_SECRET;
delete process.env.TELEGRAM_BOT_TOKEN;
delete process.env.TELEGRAM_CHAT_ID;

test('đổi vị tính lại giá, sỉ 20 và 50 không giảm chồng, đơn giữ vị đã chọn', async () => {
  const { priceItems, orderDiscount } = await import('./promo.js');
  const { listGiftBoxes, resolveGiftLine, swapPool } = await import('./giftbox.js');
  const { lookupSku } = await import('./catalog.js');
  const { boxPrice, discountAmount, quoteBox } = await import('../web/js/giftbox-core.js');
  const { ORDER_TIERS } = await import('./promo.js');
  const { formatNewOrder } = await import('./telegram.js');
  const { orderToSheetRow } = await import('./sheets.js');
  const { setVariantPrice } = await import('./db.js');
  const { createApp } = await import('./index.js');

  const pool = swapPool();
  const boxes = listGiftBoxes(pool);
  assert.ok(boxes.length >= 4, 'có hộp đổi được vị');
  assert.ok(boxes.every((box) => box.slots.filter((slot) => !slot.locked).length >= 2));
  assert.equal(boxes.some((box) => box.id === 'mqz-bo-12-vi-mut'), false, 'hũ trộn nhiều vị không đưa vào đổi ngăn');
  for (const row of pool) {
    assert.ok(row.price > 0 && row.shopId && row.grams > 0, row.sku);
    assert.notEqual(row.cat, 'set');
  }
  assert.equal(pool.some((row) => row.sku === 'VZ-GG-SRS-100'), false, 'món parked không phải lựa chọn');

  const box = boxes.find((row) => row.slots.some((slot) => !slot.locked && slot.kind === 'qua'));
  assert.ok(box, 'có ngăn trái cây đổi được');
  const listed = lookupSku(box.sku).price;
  assert.equal(box.listed, listed, 'giá hộp đọc từ danh mục, không chốt trong code');
  const defaults = box.slots.map((slot) => (slot.locked ? null : slot.sku));
  const same = resolveGiftLine({ sku: box.sku, slots: defaults, qty: 1 });
  assert.equal(same.unit, listed, 'giữ nguyên vị thì giữ giá set đang bán');

  const index = box.slots.reduce((best, slot, i) => {
    if (slot.locked || slot.kind !== 'qua') return best;
    const row = pool.find((item) => item.sku === slot.sku);
    const rate = row.price / row.grams;
    return rate < best.rate ? { i, rate } : best;
  }, { i: -1, rate: Infinity }).i;
  const current = pool.find((row) => row.sku === box.slots[index].sku);
  const pricey = pool
    .filter((row) => row.kind === 'qua' && row.sku !== current.sku && row.price / row.grams > (current.price / current.grams) * 2)
    .sort((a, b) => (b.price / b.grams) - (a.price / a.grams))[0];
  assert.ok(pricey, 'có túi đắt hơn để đổi');
  const swappedSlots = defaults.map((sku, i) => (i === index ? pricey.sku : sku));
  const swapped = resolveGiftLine({ sku: box.sku, slots: swappedSlots, qty: 1 });
  const fruit = swapped.chosen.filter((slot) => !slot.locked).reduce((sum, slot) => sum + slot.retail, 0);
  assert.equal(swapped.unit, boxPrice({ listed, baseFruit: box.baseFruit, fruit }));
  assert.ok(swapped.unit > listed, 'đổi sang túi đắt hơn thì giá hộp tăng');
  assert.ok(swapped.contents.some((row) => row.sku === pricey.sku && row.name === pricey.name));

  const bumped = pricey.price + 80000;
  setVariantPrice(pricey.sku, bumped);
  const again = resolveGiftLine({ sku: box.sku, slots: swappedSlots, qty: 1 });
  assert.ok(again.unit > swapped.unit, 'giá túi đổi trong danh mục thì giá hộp đổi theo');
  setVariantPrice(pricey.sku, null);

  const fresh = resolveGiftLine({ sku: box.sku, slots: swappedSlots, qty: 1 });
  const priced = (qty) => priceItems([{ sku: box.sku, qty, slots: swappedSlots }]);
  const q1 = priced(1);
  const q20 = priced(20);
  const q50 = priced(50);
  assert.equal(q1.items[0].price, fresh.unit);
  assert.equal(q1.discount, quoteBox({ unit: fresh.unit, qty: 1, tiers: ORDER_TIERS }).discount);

  const retail20 = q20.items[0].line;
  const once = orderDiscount([{ line: retail20, combo: false }]);
  assert.equal(once.pct, 12);
  assert.equal(q20.discount, once.discount, '20 hộp chỉ −12% một lần');
  assert.equal(q20.discount, discountAmount(retail20, 12));
  assert.ok(q20.discount < discountAmount(retail20, 12) + discountAmount(retail20, 12));
  assert.match(q20.siNote, /không giảm thêm|không giảm chồng|chỉ tính một lần/);
  assert.equal(q20.total, q20.subtotal - q20.discount + q20.ship);

  const retail50 = q50.items[0].line;
  assert.equal(q50.discount, discountAmount(retail50, 15));
  assert.ok(q50.discount > discountAmount(retail50, 12));
  assert.ok(q50.discount < discountAmount(retail50, 12) + discountAmount(retail50, 15), 'không cộng 12% và 15%');
  assert.equal(q50.discountPct, 15);
  const each20 = q20.total / 20;
  const each50 = q50.total / 50;
  assert.ok(each50 < each20, '50 hộp rẻ hơn trên mỗi hộp so với mức 20');

  const bag = lookupSku('MQ-DXO-100-GG');
  const mixed = priceItems([
    { sku: box.sku, qty: 50, slots: swappedSlots },
    { sku: bag.sku, qty: 1 },
  ]);
  const giftLine = mixed.items.find((row) => row.sku === box.sku).line;
  const bagLine = mixed.items.find((row) => row.sku === bag.sku).line;
  assert.equal(mixed.discount, discountAmount(giftLine, 15) + discountAmount(bagLine, mixed.discountPct === 15 ? 15 : orderDiscount(mixed.items).pct));
  assert.ok(mixed.discount < discountAmount(mixed.subtotal, 12) + discountAmount(giftLine, 15));

  const plain = priceItems([{ sku: bag.sku, qty: 1 }]);
  assert.equal(plain.discount, 0);
  assert.equal(plain.items[0].contents, undefined);
  assert.throws(() => priceItems([{ sku: bag.sku, qty: 1, slots: [bag.sku] }]), /không đổi vị/);

  const quote = q1;
  assert.ok(quote.items[0].contents.some((row) => row.name === pricey.name));
  const order = {
    code: 'MQ261111-TEST01',
    createdAt: '2026-11-11T04:00:00.000Z',
    payMethod: 'vietqr',
    customer: { name: 'Nguyễn An', phone: '0909123456', address: '12 đường Mộc', ward: 'Phường 1', province: 'TP. Hồ Chí Minh', note: '' },
    items: quote.items,
    summary: { subtotal: quote.subtotal, discount: quote.discount, discountPct: quote.discountPct, ship: quote.ship, total: quote.total },
  };
  const telegram = formatNewOrder(order);
  assert.match(telegram, new RegExp(pricey.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(telegram, new RegExp(`${pricey.name} ${box.slots[index].grams}g`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const sheet = orderToSheetRow(order);
  assert.match(sheet.items, new RegExp(pricey.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await (await fetch(base + '/hop-qua/' + box.id)).text();
    assert.match(page, /Đổi vị/);
    assert.match(page, /id="gift-data"/);
    assert.match(page, new RegExp(box.name));
    const home = await (await fetch(base + '/hop-qua')).text();
    assert.match(home, new RegExp('/hop-qua/' + box.id));
    const shop = await (await fetch(base + '/cua-hang?cat=set')).text();
    assert.match(shop, /Đổi vị trong hộp/);
    const mango = await (await fetch(base + '/san-pham/xoai-say-deo')).text();
    assert.doesNotMatch(mango, /Đổi vị trong hộp|\/hop-qua\//);
    const api = await fetch(base + '/api/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [{ sku: box.sku, qty: 20, slots: swappedSlots }] }),
    });
    const body = await api.json();
    assert.equal(api.status, 200);
    assert.equal(body.discount, q20.discount);
    assert.ok(body.items[0].contents.some((row) => row.sku === pricey.sku));
    const placed = await fetch(base + '/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items: [{ sku: box.sku, qty: 1, slots: swappedSlots }],
        name: 'Nguyễn An',
        phone: '0909123456',
        province: 'TP. Hồ Chí Minh',
        ward: 'Phường 1',
        address: '12 đường Mộc',
        note: 'Hộp tự chọn',
        pay: 'vietqr',
      }),
    });
    const saved = await placed.json();
    assert.equal(placed.status, 201, JSON.stringify(saved));
    const receipt = await (await fetch(base + saved.url)).text();
    assert.match(receipt, new RegExp(pricey.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  } finally {
    server.close();
  }
});
