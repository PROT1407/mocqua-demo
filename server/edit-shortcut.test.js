import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { editHref, filterCatalogItems, findCatalogItem } from '../web/js/edit-shortcut.js';
import { INSTALL_GAP_MS, installOffer } from '../web/js/pwa.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocqua-edit-'));
process.env.DB_PATH = path.join(dir, 'shop.sqlite');
process.env.ADMIN_PASSWORD = 'edit-shortcut-pass';
process.env.ADMIN_SECRET = 'edit-shortcut-secret';

test('cài app chỉ hiện trên điện thoại, và thanh dưới có đủ mục', async () => {
  const now = Date.now();
  assert.equal(installOffer({ standalone: true, mobile: true, dismissedAt: 0, now, ios: false, hasPrompt: true }), 'hidden');
  assert.equal(installOffer({ standalone: false, mobile: false, dismissedAt: 0, now, ios: false, hasPrompt: true }), 'hidden');
  assert.equal(installOffer({ standalone: false, mobile: true, dismissedAt: now - 1000, now, ios: true, hasPrompt: false }), 'hidden');
  assert.equal(installOffer({ standalone: false, mobile: true, dismissedAt: now - INSTALL_GAP_MS - 1, now, ios: true, hasPrompt: false }), 'ios');
  assert.equal(installOffer({ standalone: false, mobile: true, dismissedAt: 0, now, ios: false, hasPrompt: true }), 'android');
  assert.equal(installOffer({ standalone: false, mobile: true, dismissedAt: 0, now, ios: false, hasPrompt: false }), 'hidden');
});

test('deep link khớp đúng combo và món lẻ, không lấy món đầu danh sách', () => {
  const products = [
    { id: 'xoai-say-deo', name: 'Xoài sấy dẻo Fresh & Healthy', variants: [{ sku: 'MQ-XOAI-100' }] },
    { id: 'vz-mix-cb-ymo', name: 'Combo sầu riêng thăng hoa Yummy 105g + xoài muối ớt GoodGood 200g', variants: [{ sku: 'MQ-THSR-105-YM' }, { sku: 'MQ-DXM-200-GG' }] },
    { id: 'sau-rieng-say-thang-hoa-yummy', name: 'Sầu riêng sấy thăng hoa Yummy 105g', variants: [{ sku: 'MQ-THSR-105' }] },
  ];
  assert.equal(editHref('/san-pham/vz-mix-cb-ymo'), '/admin?edit=product&id=vz-mix-cb-ymo');
  assert.equal(editHref('/san-pham/VZ-MIX-CB-YMO'), '/admin?edit=product&id=vz-mix-cb-ymo');
  assert.equal(editHref('/san-pham/sau-rieng-say-thang-hoa-yummy'), '/admin?edit=product&id=sau-rieng-say-thang-hoa-yummy');
  const combo = findCatalogItem(products, 'VZ-MIX-CB-YMO');
  const single = findCatalogItem(products, 'sau-rieng-say-thang-hoa-yummy');
  assert.equal(combo.id, 'vz-mix-cb-ymo');
  assert.equal(single.id, 'sau-rieng-say-thang-hoa-yummy');
  assert.notEqual(combo.id, products[0].id);
  assert.equal(findCatalogItem(products, 'khong-co'), null);
  assert.deepEqual(filterCatalogItems(products, combo.name, combo.id).map((item) => item.id), ['vz-mix-cb-ymo']);
  assert.deepEqual(filterCatalogItems(products, 'vz-mix-cb-ymo').map((item) => item.id), ['vz-mix-cb-ymo']);
  assert.deepEqual(filterCatalogItems(products, single.name, single.id).map((item) => item.id), ['sau-rieng-say-thang-hoa-yummy']);
});

test('nút Sửa chỉ trỏ đúng chỗ, và không có trong HTML của khách', async () => {
  delete process.env.CATALOG_GITHUB_TOKEN;
  assert.equal(editHref('/'), '/admin?edit=home');
  assert.equal(editHref('/cua-hang'), '/admin?edit=page&page=shop');
  assert.equal(editHref('/cua-hang', '?cat=thanghoa'), '/admin?edit=page&page=thanghoa');
  assert.equal(editHref('/danh-muc'), '/admin?edit=page&page=catalog');
  assert.equal(editHref('/combo'), '/admin?edit=page&page=combo');
  assert.equal(editHref('/hop-qua'), '/admin?edit=page&page=gift');
  assert.equal(editHref('/san-pham/sau-rieng-say-thang-hoa-yummy'), '/admin?edit=product&id=sau-rieng-say-thang-hoa-yummy');
  assert.equal(editHref('/san-pham/vz-mix-cb-ymo'), '/admin?edit=product&id=vz-mix-cb-ymo');
  assert.equal(editHref('/gio-hang'), '');

  const { createApp } = await import('./index.js');
  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const anon = await fetch(base + '/');
    assert.equal(anon.status, 200);
    const home = await anon.text();
    assert.match(home, /class="tabbar"/);
    assert.match(home, /Cài app Mộc Quả/);
    assert.match(home, /Tư vấn/);
    assert.match(home, /\/static\/js\/edit-shortcut\.js/);
    const admin = await (await fetch(base + '/admin')).text();
    assert.doesNotMatch(admin, /class="tabbar"/);
    assert.match(admin, /Kiểm tra kết nối/);
    assert.doesNotMatch(home, /class="edit-shortcut"|✏️ Sửa/);
    const cart = await (await fetch(base + '/gio-hang')).text();
    assert.doesNotMatch(cart, /edit-shortcut\.js|✏️ Sửa/);
    assert.equal((await fetch(base + '/api/admin/me')).status, 401);
    const login = await fetch(base + '/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'edit-shortcut-pass' }),
    });
    const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    const me = await fetch(base + '/api/admin/me', { headers: { cookie } });
    assert.equal(me.status, 200);
    const meBody = await me.json();
    assert.equal(meBody.storage.state, 'missing');
    assert.equal(JSON.stringify(meBody).includes('github_pat'), false);
    assert.equal((await fetch(base + '/api/admin/catalog-store/check', { method: 'POST' })).status, 401);
    const checked = await fetch(base + '/api/admin/catalog-store/check', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{}' });
    assert.equal(checked.status, 200);
    const storeBody = await checked.json();
    assert.deepEqual(storeBody.storage, { mode: 'ephemeral', state: 'missing', http: 0 });
    assert.equal(JSON.stringify(storeBody).includes('TOKEN'), false);
    const authed = await (await fetch(base + '/san-pham/sau-rieng-say-thang-hoa-yummy', { headers: { cookie } })).text();
    assert.match(authed, /\/static\/js\/edit-shortcut\.js/);
    assert.doesNotMatch(authed, /class="edit-shortcut"|✏️ Sửa/);
  } finally {
    server.close();
  }
});
