import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocqua-'));
process.env.DB_PATH = path.join(dir, 'shop.sqlite');
process.env.ADMIN_PASSWORD = 'test-pass';
process.env.ADMIN_SECRET = 'test-secret';
process.env.BANK_BIN = '000000';
process.env.BANK_NAME = 'Ngan hang thu';
process.env.ACCOUNT_NO = '0000000000';
process.env.ACCOUNT_NAME = 'MOC QUA TEST';

function cookieOf(res) {
  const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
  return (list.find(Boolean) || '').split(';')[0];
}

test('khách xem hàng, giỏ tính quà, VietQR, admin sửa giá và trạng thái', async () => {
  const { createApp } = await import('./index.js');
  const { getShopCatalog } = await import('./catalog.js');
  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const shop = getShopCatalog();
    const mangoes = shop.products.filter((p) => p.fruit === 'xoai' && !p.id.startsWith('combo-'));
    let bag = null;
    let owner = null;
    for (const product of mangoes) {
      const variant = product.variants.find((v) => v.g >= 200 && v.g < 400 && v.price > 0 && v.sku !== shop.settings.giftSku);
      if (variant) {
        bag = variant;
        owner = product;
        break;
      }
    }
    assert.ok(bag, 'cần một túi xoài từ 200g đến dưới 400g');
    const bigOwner = mangoes.find((p) => p.variants.some((v) => v.g >= 500 && v.price > 0));
    const big = bigOwner?.variants.find((v) => v.g >= 500 && v.price > 0);
    const side = shop.products.find((p) => p.fruit && p.fruit !== 'xoai' && p.variants.some((v) => v.price > 0 && v.g > 0 && v.g < 150));
    const small = side.variants.find((v) => v.price > 0 && v.g > 0 && v.g < 150);

    const home = await (await fetch(base + '/')).text();
    assert.match(home, /\/static\/css\/shop\.css/);
    assert.match(home, /\/static\/js\/store\.js/);
    assert.equal((await fetch(base + '/static/css/shop.css')).status, 200);
    assert.equal((await fetch(base + '/static/js/store.js')).status, 200);
    assert.equal((await fetch(base + '/static/js/product.js')).status, 200);
    assert.match(home, /Bốn cách sấy/);
    assert.match(home, /viza-ke-05/);
    assert.match(home, /xoai-deo-muoi-ot/);

    const deo = await (await fetch(base + '/cua-hang?cat=deo')).text();
    assert.match(deo, /Cách sấy/);
    assert.match(deo, /Loại quả/);
    assert.match(deo, /Hãng/);
    assert.match(deo, /Sấy dẻo/);

    const found = await (await fetch(base + '/cua-hang?q=xoai')).text();
    assert.match(found, /Xoài/);

    const pdp = await (await fetch(base + '/san-pham/' + owner.id)).text();
    assert.match(pdp, /Khối lượng/);
    assert.match(pdp, new RegExp(bag.sku));

    const quote = async (items) => {
      const res = await fetch(base + '/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      assert.equal(res.status, 200, JSON.stringify(data));
      return data;
    };

    const one = await quote([{ sku: bag.sku, qty: 1 }]);
    assert.equal(one.giftQty, one.subtotal >= shop.settings.giftMin ? 1 : 0);

    const two = await quote([{ sku: bag.sku, qty: 2 }]);
    assert.equal(two.subtotal, bag.price * 2);
    assert.equal(two.gifts[0].qty, 1);
    assert.equal(two.gifts[0].price, 0);
    if (two.subtotal < shop.settings.freeShip) assert.equal(two.ship, shop.settings.shipFee);
    assert.equal(two.total, two.subtotal + two.ship);

    const eight = await quote([{ sku: bag.sku, qty: 8 }]);
    assert.equal(eight.gifts[0].qty, 3);
    if (eight.subtotal >= shop.settings.freeShip) assert.equal(eight.ship, 0);

    if (big && big.price * 2 >= shop.settings.giftMin) {
      const pair = await quote([{ sku: big.sku, qty: 2 }]);
      assert.equal(pair.gifts[0].qty, 1);
    }

    const need = Math.max(0, shop.settings.giftMin - bag.price);
    const extra = Math.ceil(need / small.price);
    const mixed = await quote([{ sku: bag.sku, qty: 1 }, { sku: small.sku, qty: extra }]);
    assert.ok(mixed.subtotal >= shop.settings.giftMin);
    assert.equal(mixed.gifts[0].qty, 1);

    const orderRes = await fetch(base + '/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items: [{ sku: bag.sku, qty: 2 }],
        name: 'Nguyễn An',
        phone: '0909123456',
        province: shop.provinces[0],
        ward: 'Phường 1',
        address: '12 đường Mộc',
        note: 'Giao buổi chiều',
        pay: 'vietqr',
      }),
    });
    const order = await orderRes.json();
    assert.equal(orderRes.status, 201, JSON.stringify(order));
    assert.equal(order.total, two.total);
    assert.match(order.code, /^MQ\d{6}-[A-Z0-9]{6}$/);
    assert.match(order.vietqr.url, new RegExp(`amount=${order.total}`));
    assert.ok(order.vietqr.url.includes('addInfo=' + encodeURIComponent(order.code)));
    assert.match(order.vietqr.url, /img\.vietqr\.io\/image\/000000-0000000000-compact2\.png/);

    const receipt = await (await fetch(base + '/don/' + order.code)).text();
    assert.match(receipt, new RegExp(order.code));
    assert.match(receipt, new RegExp(`amount=${order.total}`));
    assert.match(receipt, new RegExp(`data-amount="${order.total}"`));
    assert.match(receipt, /0đ/);

    const badLogin = await fetch(base + '/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'sai' }),
    });
    assert.equal(badLogin.status, 401);

    const login = await fetch(base + '/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'test-pass' }),
    });
    assert.equal(login.status, 200);
    const cookie = cookieOf(login);
    assert.match(cookie, /^mq_admin=/);
    const auth = { cookie, 'content-type': 'application/json' };

    const orders = await (await fetch(base + '/api/admin/orders', { headers: auth })).json();
    assert.equal(orders.orders[0].code, order.code);
    assert.equal(orders.orders[0].status, 'cho_ck');

    const marked = await fetch(base + '/api/admin/orders/' + order.code, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ status: 'dang_giao' }),
    });
    assert.equal(marked.status, 200);
    const after = await (await fetch(base + '/api/orders/' + order.code)).json();
    assert.equal(after.status, 'dang_giao');

    const bumped = bag.price + 1000;
    const priceRes = await fetch(base + '/api/admin/variants/' + bag.sku, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ price: bumped }),
    });
    assert.equal(priceRes.status, 200);
    const repriced = await quote([{ sku: bag.sku, qty: 1 }]);
    assert.equal(repriced.items[0].price, bumped);
    const reset = await fetch(base + '/api/admin/variants/' + bag.sku, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ price: null }),
    });
    assert.equal(reset.status, 200);
    const restored = await quote([{ sku: bag.sku, qty: 1 }]);
    assert.equal(restored.items[0].price, bag.price);

    const hidden = await fetch(base + '/api/admin/products/' + side.id, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ hidden: true }),
    });
    assert.equal(hidden.status, 200);
    assert.equal((await fetch(base + '/san-pham/' + side.id)).status, 404);
    await fetch(base + '/api/admin/products/' + side.id, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ hidden: false }),
    });
    assert.equal((await fetch(base + '/san-pham/' + side.id)).status, 200);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
