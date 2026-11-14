import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { listPriceForGrams, promoLabel, resolveSale } from '../ai-server/src/sale.js';

// 30/11/2026 23:59:59 ICT còn khuyến mãi. 01/12/2026 00:00:00 ICT hết.
const DURING = new Date('2026-11-30T16:59:59.000Z');
const AFTER = new Date('2026-11-30T17:00:00.000Z');

test('giá gốc tính theo 33.000đ/100g, làm tròn nghìn', () => {
  assert.equal(listPriceForGrams(33000, 100), 33000);
  assert.equal(listPriceForGrams(33000, 200), 66000);
  assert.equal(listPriceForGrams(33000, 250), 83000);
  assert.equal(listPriceForGrams(33000, 300), 99000);
  assert.equal(listPriceForGrams(33000, 500), 165000);
  assert.equal(promoLabel('2026-12-01T00:00:00+07:00'), 'KM đến 30/11');
  const sized = resolveSale({
    price: 70000,
    grams: 250,
    listPer100g: 33000,
    promo: { price: 70000, endsAt: '2026-12-01T00:00:00+07:00' },
  }, DURING);
  assert.equal(sized.price, 70000);
  assert.equal(sized.compareAt, 83000);
  assert.equal(sized.promo.label, 'KM đến 30/11');
  assert.equal(resolveSale({
    price: 139000,
    grams: 500,
    listPer100g: 33000,
    promo: { price: 139000, originalPrice: 170000, endsAt: '2026-12-01T00:00:00+07:00' },
  }, DURING).compareAt, 170000);
  assert.equal(resolveSale({
    price: 70000,
    grams: 250,
    listPer100g: 33000,
    promoEndsAt: '2026-12-01T00:00:00+07:00',
  }, AFTER).price, 83000);
});

test('trước và sau 1/12 ICT chỉ mít thái Fresh & Healthy đổi giá', async () => {
  if (!process.env.DB_PATH) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocqua-sale-'));
    process.env.DB_PATH = path.join(dir, 'shop.sqlite');
    process.env.ADMIN_PASSWORD = 'test-pass-sale';
    process.env.ADMIN_SECRET = 'test-secret-sale';
  }
  const { getShopCatalog, lookupSku } = await import('./catalog.js');
  const { catalogWithPrices } = await import('./danhmuc.js');
  const { priceItems } = await import('./promo.js');

  const shopPrices = (now) => new Map(getShopCatalog(now).products.flatMap((p) => p.variants.map((v) => [v.sku, v.price])));
  const before = shopPrices(DURING);
  const after = shopPrices(AFTER);
  const changed = [...before.keys()].filter((sku) => before.get(sku) !== after.get(sku)).sort();
  assert.deepEqual(changed, ['MQ-GMI-300-FH', 'MQ-GMI-500-FH']);
  assert.equal(before.get('MQ-GMI-300-FH'), 74000);
  assert.equal(after.get('MQ-GMI-300-FH'), 99000);
  assert.equal(before.get('MQ-GMI-500-FH'), 139000);
  assert.equal(after.get('MQ-GMI-500-FH'), 165000);
  for (const sku of ['MQZ-GMI-500', 'VZ-MIX-CB2XMI-500', 'MQ-THXO-120-CH', 'MQ-DXO-200-FHV']) {
    assert.equal(before.get(sku), after.get(sku), sku);
    assert.equal(before.get(sku) > 0, true, sku);
  }

  const mit = getShopCatalog(DURING).products.find((p) => p.id === 'mit-say-gion');
  const v300 = mit.variants.find((v) => v.sku === 'MQ-GMI-300-FH');
  const v500 = mit.variants.find((v) => v.sku === 'MQ-GMI-500-FH');
  assert.equal(v300.compareAt, 99000);
  assert.equal(v300.promo.label, 'KM đến 30/11');
  assert.equal(v500.price, 139000);
  assert.equal(v500.compareAt, 165000);
  assert.equal(v500.promo.label, 'KM đến 30/11');
  const laterMit = getShopCatalog(AFTER).products.find((p) => p.id === 'mit-say-gion');
  assert.equal(laterMit.variants.every((v) => v.promo == null && v.compareAt == null), true);

  const dmPrices = (now) => new Map(catalogWithPrices(now).products.flatMap((p) => p.variants.filter((v) => v.price != null).map((v) => [v.code, v.price])));
  const dmBefore = dmPrices(DURING);
  const dmAfter = dmPrices(AFTER);
  const dmChanged = [...dmBefore.keys()].filter((code) => dmBefore.get(code) !== dmAfter.get(code)).sort();
  assert.deepEqual(dmChanged, ['MQ-GMI-500-FH', 'VZ-FH-MIT-300']);
  assert.equal(dmBefore.get('VZ-FH-MIT-300'), 74000);
  assert.equal(dmAfter.get('VZ-FH-MIT-300'), 99000);
  assert.equal(dmBefore.get('MQ-GMI-500-FH'), 139000);
  assert.equal(dmAfter.get('MQ-GMI-500-FH'), 165000);
  assert.equal(dmBefore.get('MQZ-GMI-500'), dmAfter.get('MQZ-GMI-500'));
  assert.equal(dmBefore.get('VZ-MIX-CB2XMI-500'), dmAfter.get('VZ-MIX-CB2XMI-500'));
  assert.equal(dmBefore.get('VZ-FH-XD-250'), 99000);
  const live = catalogWithPrices(DURING).products.find((p) => p.id === 'vz-fh-mit');
  assert.equal(live.listPer100g, 33000);
  assert.equal(live.variants.find((v) => v.code === 'VZ-FH-MIT-300').promo.originalPrice, 99000);
  assert.equal(live.variants.find((v) => v.code === 'MQ-GMI-500-FH').promo.originalPrice, 165000);
  assert.equal(catalogWithPrices(AFTER).products.find((p) => p.id === 'vz-fh-mit').variants.every((v) => !v.promo), true);

  const quote = (sku, now) => priceItems([{ sku, qty: 2 }], { now });
  const qBefore = quote('MQ-GMI-300-FH', DURING);
  const qAfter = quote('MQ-GMI-300-FH', AFTER);
  assert.equal(qBefore.items[0].price, 74000);
  assert.equal(qBefore.items[0].compareAt, 99000);
  assert.equal(qBefore.items[0].line, 148000);
  assert.equal(qBefore.subtotal, 148000);
  assert.equal(qAfter.items[0].price, 99000);
  assert.equal(qAfter.items[0].compareAt, undefined);
  assert.equal(qAfter.subtotal, 198000);
  assert.equal(quote('MQ-GMI-500-FH', DURING).items[0].price, 139000);
  assert.equal(quote('MQ-GMI-500-FH', DURING).items[0].compareAt, 165000);
  assert.equal(quote('MQ-GMI-500-FH', AFTER).items[0].price, 165000);
  assert.equal(quote('VZ-MIX-CB2XMI-500', DURING).total - quote('VZ-MIX-CB2XMI-500', AFTER).total, 0);
  assert.equal(quote('MQZ-GMI-500', AFTER).items[0].price, 159000);
  assert.equal(lookupSku('MQ-DXO-200-FHV', { now: AFTER }).price, lookupSku('MQ-DXO-200-FHV', { now: DURING }).price);
  assert.equal(lookupSku('MQ-THXO-120-CH', { now: AFTER }).compareAt, undefined);
});
