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

function setCookieHeader(res) {
  if (typeof res.headers.getSetCookie === 'function') return res.headers.getSetCookie().join('\n');
  return res.headers.get('set-cookie') || '';
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
    assert.match(home, /0931330248/);
    assert.match(home, /0919997283/);
    assert.match(home, /huydaigia1407@gmail.com/);
    assert.match(home, /Nguyễn Đình Chiểu/);
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

    const contactPage = await (await fetch(base + '/lien-he.html')).text();
    assert.match(contactPage, /0931330248/);
    assert.match(contactPage, /0919997283/);
    assert.match(contactPage, /huydaigia1407@gmail.com/);
    assert.match(contactPage, /19029781376018/);
    assert.match(contactPage, /Techcombank/);
    assert.match(contactPage, /@mocqua79/);
    assert.doesNotMatch(contactPage, /0909000000|hello@mocqua\.com|CÔNG TY MỘC QUẢ/);

    const checkout = await (await fetch(base + '/thanh-toan')).text();
    assert.match(checkout, /0000000000/);
    assert.match(checkout, /Ngan hang thu/);
    assert.match(checkout, /MOC QUA TEST/);

    const story = await (await fetch(base + '/cau-chuyen.html')).text();
    assert.match(story, /0931330248/);
    assert.match(story, /huydaigia1407@gmail.com/);
    assert.match(story, /Nguyễn Đình Chiểu/);

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
    const { SESSION_TTL_SECONDS } = await import('./auth.js');
    const sessionCookie = setCookieHeader(login);
    assert.match(sessionCookie, /HttpOnly/);
    assert.match(sessionCookie, /SameSite=Lax/);
    assert.match(sessionCookie, new RegExp(`Max-Age=${SESSION_TTL_SECONDS}`));
    assert.doesNotMatch(sessionCookie, /Secure/);
    const secureLogin = await fetch(base + '/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-proto': 'https' },
      body: JSON.stringify({ password: 'test-pass' }),
    });
    assert.equal(secureLogin.status, 200);
    const secureCookie = setCookieHeader(secureLogin);
    assert.match(secureCookie, /HttpOnly/);
    assert.match(secureCookie, /SameSite=Lax/);
    assert.match(secureCookie, /Secure/);
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

    const savedBank = {
      BANK_BIN: process.env.BANK_BIN,
      BANK_NAME: process.env.BANK_NAME,
      ACCOUNT_NO: process.env.ACCOUNT_NO,
      ACCOUNT_NAME: process.env.ACCOUNT_NAME,
    };
    delete process.env.BANK_BIN;
    delete process.env.BANK_NAME;
    delete process.env.ACCOUNT_NO;
    delete process.env.ACCOUNT_NAME;
    try {
      const { bankConfig, vietqrFor } = await import('./vietqr.js');
      const { checkoutPage } = await import('./pages.js');
      const { getShopCatalog: catalogNow } = await import('./catalog.js');
      const bank = bankConfig();
      assert.equal(bank.ready, true);
      assert.equal(bank.bin, '970407');
      assert.equal(bank.bankName, 'Techcombank');
      assert.equal(bank.accountNo, '19029781376018');
      assert.equal(bank.accountName, 'NGUYEN NGOC HUY');
      const qr = vietqrFor(125000, 'MQ251025-TEST01');
      assert.match(qr.url, /img\.vietqr\.io\/image\/970407-19029781376018-compact2\.png/);
      assert.match(qr.url, /amount=125000/);
      assert.match(qr.url, /accountName=NGUYEN\+NGOC\+HUY/);
      const bare = checkoutPage(catalogNow());
      assert.match(bare, /19029781376018/);
      assert.match(bare, /Techcombank/);
      assert.match(bare, /NGUYEN NGOC HUY/);
      assert.match(bare, /0931330248/);
    } finally {
      for (const [key, value] of Object.entries(savedBank)) process.env[key] = value;
    }

    const adminHtml = await (await fetch(base + '/admin')).text();
    assert.match(adminHtml, /Xuất tất cả \(JSON\)/);
    assert.match(adminHtml, /Xuất đơn \(CSV\)/);
    assert.match(adminHtml, /không giữ file/);
    assert.match(adminHtml, /Thêm đơn còn thiếu/);
    assert.match(adminHtml, /Thay toàn bộ đơn bằng file/);

    assert.equal((await fetch(base + '/api/admin/backup.json')).status, 401);
    assert.equal((await fetch(base + '/api/admin/backup.csv')).status, 401);
    const anonImport = await fetch(base + '/api/admin/backup?mode=merge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(anonImport.status, 401);

    const jsonRes = await fetch(base + '/api/admin/backup.json', { headers: auth });
    assert.equal(jsonRes.status, 200);
    assert.match(jsonRes.headers.get('content-type') || '', /application\/json/);
    assert.match(jsonRes.headers.get('content-disposition') || '', /attachment; filename="mocqua-backup-\d{8}-\d{4}\.json"/);
    assert.equal(jsonRes.headers.get('cache-control'), 'no-store');
    const backup = await jsonRes.json();
    assert.equal(backup.version, 1);
    const savedOrder = backup.orders.find((item) => item.code === order.code);
    assert.ok(savedOrder, 'bản sao phải có đơn vừa đặt');
    assert.equal(savedOrder.customer.phone, '0909123456');
    assert.equal(savedOrder.status, 'dang_giao');
    assert.ok(savedOrder.items.length >= 1);
    assert.ok(savedOrder.gifts.length >= 1);
    assert.equal(typeof backup.settings.giftMin, 'number');

    const csvRes = await fetch(base + '/api/admin/backup.csv', { headers: auth });
    assert.equal(csvRes.status, 200);
    assert.match(csvRes.headers.get('content-type') || '', /text\/csv/);
    assert.match(csvRes.headers.get('content-disposition') || '', /attachment; filename="mocqua-orders-/);
    const csvBytes = Buffer.from(await csvRes.arrayBuffer());
    assert.equal(csvBytes.subarray(0, 3).toString('hex'), 'efbbbf');
    const csv = csvBytes.toString('utf8');
    assert.match(csv, new RegExp(order.code));
    assert.match(csv, /0909123456/);
    assert.match(csv, /Quà/);

    const mergeRes = await fetch(base + '/api/admin/backup?mode=merge', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(backup),
    });
    const mergeBody = await mergeRes.json();
    assert.equal(mergeRes.status, 200, JSON.stringify(mergeBody));
    assert.equal(mergeBody.added, 0);
    assert.equal(mergeBody.skipped, backup.orders.length);

    const blockedReplace = await fetch(base + '/api/admin/backup?mode=replace', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(backup),
    });
    assert.equal(blockedReplace.status, 400);
    assert.equal((await (await fetch(base + '/api/orders/' + order.code)).json()).status, 'dang_giao');

    const extraBackup = structuredClone(backup);
    extraBackup.orders.push({
      ...savedOrder,
      code: 'MQ261025-EXTRA1',
      customer: { ...savedOrder.customer, name: '=1+1' },
      note: 'don phu',
    });
    const replaced = await fetch(base + '/api/admin/backup?mode=replace&confirm=THAY-HET', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(extraBackup),
    });
    const replacedBody = await replaced.json();
    assert.equal(replaced.status, 200, JSON.stringify(replacedBody));
    assert.equal(replacedBody.added, extraBackup.orders.length);
    const dangerCsv = await (await fetch(base + '/api/admin/backup.csv', { headers: auth })).text();
    assert.match(dangerCsv, /'=1\+1/);
    assert.doesNotMatch(dangerCsv, /(^|,)=1\+1(,|$)/m);

    const keepRes = await fetch(base + '/api/admin/backup?mode=merge', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(backup),
    });
    const keepBody = await keepRes.json();
    assert.equal(keepRes.status, 200, JSON.stringify(keepBody));
    assert.equal(keepBody.added, 0);
    const listed = await (await fetch(base + '/api/admin/orders', { headers: auth })).json();
    assert.ok(listed.orders.some((item) => item.code === 'MQ261025-EXTRA1'));

    const badImport = await fetch(base + '/api/admin/backup?mode=merge', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ version: 1, orders: [{ code: 'nope' }] }),
    });
    assert.equal(badImport.status, 400);
    const afterBad = await (await fetch(base + '/api/admin/orders', { headers: auth })).json();
    assert.ok(afterBad.orders.some((item) => item.code === 'MQ261025-EXTRA1'));

    const settingsNow = await (await fetch(base + '/api/admin/settings', { headers: auth })).json();
    const tweaked = { ...settingsNow.settings, giftMin: settingsNow.settings.giftMin + 1000 };
    const tweakRes = await fetch(base + '/api/admin/settings', {
      method: 'PUT',
      headers: auth,
      body: JSON.stringify(tweaked),
    });
    assert.equal(tweakRes.status, 200, JSON.stringify(await tweakRes.clone().json()));
    const restoreShop = await fetch(base + '/api/admin/backup?mode=merge&restoreShop=1', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(backup),
    });
    const restoreBody = await restoreShop.json();
    assert.equal(restoreShop.status, 200, JSON.stringify(restoreBody));
    assert.equal(restoreBody.restoredShop, true);
    const settingsBack = await (await fetch(base + '/api/admin/settings', { headers: auth })).json();
    assert.equal(settingsBack.settings.giftMin, backup.settings.giftMin);

    const cleaned = await fetch(base + '/api/admin/backup?mode=replace&confirm=THAY-HET', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(backup),
    });
    assert.equal(cleaned.status, 200);
    const cleanedList = await (await fetch(base + '/api/admin/orders', { headers: auth })).json();
    assert.equal(cleanedList.orders.some((item) => item.code === 'MQ261025-EXTRA1'), false);
    assert.ok(cleanedList.orders.some((item) => item.code === order.code));

    const homeRes = await fetch(base + '/');
    const csp = homeRes.headers.get('content-security-policy') || '';
    assert.equal(homeRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(homeRes.headers.get('x-frame-options'), 'DENY');
    assert.equal(homeRes.headers.get('referrer-policy'), 'same-origin');
    assert.match(homeRes.headers.get('permissions-policy') || '', /camera=\(\)/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /img\.vietqr\.io/);
    assert.match(csp, /script-src 'self'/);
    assert.match(csp, /fonts\.googleapis\.com/);
    assert.doesNotMatch(csp, /unsafe-eval/);
    assert.equal(homeRes.headers.get('strict-transport-security'), null);
    const homeHtml = await homeRes.text();
    assert.match(homeHtml, /rel="manifest"/);
    assert.match(homeHtml, /apple-touch-icon/);
    assert.match(homeHtml, /apple-mobile-web-app-title/);
    assert.match(homeHtml, /name="theme-color" content="#F7F1E8"/);
    assert.match(homeHtml, /\/static\/js\/pwa\.js/);
    assert.doesNotMatch(homeHtml, /test-pass|test-secret/);

    const secureHealth = await fetch(base + '/api/health', { headers: { 'x-forwarded-proto': 'https' } });
    assert.match(secureHealth.headers.get('strict-transport-security') || '', /max-age=15552000/);

    const manifestRes = await fetch(base + '/manifest.webmanifest');
    assert.equal(manifestRes.status, 200);
    assert.match(manifestRes.headers.get('content-type') || '', /manifest\+json/);
    const manifest = await manifestRes.json();
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.start_url, '/');
    assert.equal(manifest.scope, '/');
    assert.match(manifest.name, /Mộc Quả/);
    assert.equal(manifest.theme_color, '#F7F1E8');
    assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192' && icon.type === 'image/png'));
    assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'));

    const swRes = await fetch(base + '/sw.js');
    assert.equal(swRes.status, 200);
    assert.match(swRes.headers.get('content-type') || '', /javascript/);
    assert.match(swRes.headers.get('cache-control') || '', /no-cache/);
    const sw = await swRes.text();
    assert.match(sw, /addEventListener\('fetch'/);
    assert.match(sw, /\/api\//);
    assert.match(sw, /request\.method !== 'GET'/);
    assert.match(sw, /url\.origin !== self\.location\.origin/);
    assert.doesNotMatch(sw, /test-pass|ADMIN_PASSWORD|ADMIN_SECRET/);

    for (const [file, size] of [['/icons/icon-192.png', 192], ['/icons/icon-512.png', 512], ['/icons/apple-touch-icon.png', 180]]) {
      const iconRes = await fetch(base + file);
      assert.equal(iconRes.status, 200, file);
      const png = Buffer.from(await iconRes.arrayBuffer());
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', file);
      assert.equal(png.readUInt32BE(16), size, file);
      assert.equal(png.readUInt32BE(20), size, file);
    }

    const offline = await (await fetch(base + '/offline')).text();
    assert.match(offline, /Đang không có mạng/);
    assert.match(offline, /Giỏ vẫn nằm trên máy/);

    const payPage = await (await fetch(base + '/thanh-toan')).text();
    assert.match(payPage, /stk__no/);
    assert.match(payPage, /Đặt và hiện mã QR/);
    assert.match(payPage, /id="co-due"/);
    assert.match(payPage, /Chép số tài khoản|stkcard|0000000000/);

    const adminShell = await (await fetch(base + '/admin')).text();
    assert.match(adminShell, /<details>/);
    assert.match(adminShell, /không giữ file/);
    const adminJs = await (await fetch(base + '/static/js/admin.js')).text();
    assert.doesNotMatch(adminJs, /test-pass|test-secret/);

    const { sameOriginState } = await import('./guard.js');
    const fakeReq = (headers, protocol = 'https') => ({
      protocol,
      get(name) {
        const found = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
        return found ? headers[found] : undefined;
      },
    });
    assert.equal(sameOriginState(fakeReq({ host: 'mocqua.onrender.com', origin: 'https://mocqua.onrender.com' })), true);
    assert.equal(sameOriginState(fakeReq({ host: 'mocqua.onrender.com', origin: 'https://evil.example' })), false);
    assert.equal(sameOriginState(fakeReq({ host: 'mocqua.onrender.com', origin: 'null' })), false);
    assert.equal(sameOriginState(fakeReq({ host: '127.0.0.1:3000', 'sec-fetch-site': 'cross-site' }, 'http')), false);
    assert.equal(sameOriginState(fakeReq({ host: '127.0.0.1:3000', 'sec-fetch-site': 'same-origin' }, 'http')), true);
    assert.equal(sameOriginState(fakeReq({ host: 'mocqua.onrender.com', referer: 'https://evil.example/x' })), false);
    assert.equal(sameOriginState(fakeReq({ host: '127.0.0.1:3000' }, 'http')), true);

    const openQuote = await fetch(base + '/api/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify({ items: [] }),
    });
    assert.equal(openQuote.status, 200);

    const evilLogin = await fetch(base + '/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify({ password: 'test-pass' }),
    });
    assert.equal(evilLogin.status, 403);
    const blockedLogout = await fetch(base + '/api/admin/logout', {
      method: 'POST',
      headers: { cookie, origin: 'https://evil.example', 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(blockedLogout.status, 403);
    assert.equal((await fetch(base + '/api/admin/me', { headers: { cookie } })).status, 200);
    const crossSite = await fetch(base + '/api/admin/orders/' + order.code, {
      method: 'PATCH',
      headers: { cookie, 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' },
      body: JSON.stringify({ status: 'xong' }),
    });
    assert.equal(crossSite.status, 403);
    assert.equal((await (await fetch(base + '/api/orders/' + order.code)).json()).status, 'dang_giao');
    const referred = await fetch(base + '/api/admin/settings', {
      method: 'PUT',
      headers: { cookie, 'content-type': 'application/json', referer: 'https://evil.example/admin' },
      body: '{}',
    });
    assert.equal(referred.status, 403);
    const sameLogout = await fetch(base + '/api/admin/logout', {
      method: 'POST',
      headers: { cookie, origin: base, 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(sameLogout.status, 200);

    const { LOGIN_FAIL_MAX, resetLoginFailures } = await import('./auth.js');
    resetLoginFailures();
    for (let i = 0; i < LOGIN_FAIL_MAX; i += 1) {
      const missed = await fetch(base + '/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'sai-lan-' + i }),
      });
      assert.equal(missed.status, 401);
    }
    const locked = await fetch(base + '/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'test-pass' }),
    });
    assert.equal(locked.status, 429);
    resetLoginFailures();
    const unlocked = await fetch(base + '/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'test-pass' }),
    });
    assert.equal(unlocked.status, 200);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('trang tĩnh không còn số và email mẫu của shop', async () => {
  const { ROOT } = await import('./paths.js');
  const { shopContact, bankDefaults } = await import('./contact.js');
  const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');
  const phones = shopContact.phones.map((p) => p.tel);
  const shared = [...phones, shopContact.email, 'Nguyễn Đình Chiểu', shopContact.facebook, shopContact.tiktok];
  const bankBits = ['Techcombank', bankDefaults.accountNo];
  const expect = {
    'js/app.js': [...shared, ...bankBits, '970407', 'Nguyen Ngoc Huy', 'img.vietqr.io'],
    'lien-he.html': [...shared, ...bankBits, 'Nguyen Ngoc Huy'],
    'cau-chuyen.html': shared,
    'chinh-sach.html': [...phones, ...bankBits, 'Nguyen Ngoc Huy'],
    'index.html': phones,
    'thanh-toan.html': [...bankBits, 'Nguyen Ngoc Huy'],
    'js/pages/checkout.js': ['vietqrUrl', 'Techcombank'],
    'js/pages/confirm.js': ['vietqrUrl', 'MQ.BANK'],
    '.env.example': [...bankBits, bankDefaults.accountName],
    'README.md': [shopContact.phones[0].display, shopContact.phones[1].display, shopContact.email, 'Nguyễn Đình Chiểu', ...bankBits, '970407', bankDefaults.accountName],
  };
  const banned = ['0909 000 000', 'hello@mocqua.com', 'CÔNG TY MỘC QUẢ', 'https://m.me/', '[Đang cập nhật]'];
  for (const [name, bits] of Object.entries(expect)) {
    const text = read(name);
    for (const bit of bits) assert.ok(text.includes(bit), `${name} thiếu ${bit}`);
    for (const bit of banned) assert.equal(text.includes(bit), false, `${name} còn ${bit}`);
    if (name !== 'README.md') assert.equal(text.includes('0909000000'), false, `${name} còn 0909000000`);
  }
  const sampleOnly = read('tra-cuu-don.html') + read('js/ui.js');
  assert.match(sampleOnly, /0909000000/);
  assert.doesNotMatch(sampleOnly, /hello@mocqua\.com/);
});

test('máy chủ không khởi động khi mật khẩu admin yếu', async () => {
  const { spawnSync } = await import('node:child_process');
  const { adminPasswordIssue } = await import('./auth.js');
  const { ROOT } = await import('./paths.js');
  assert.match(adminPasswordIssue(''), /ADMIN_PASSWORD/);
  assert.match(adminPasswordIssue('admin'), /yếu/);
  assert.match(adminPasswordIssue('1234567890'), /yếu/);
  assert.match(adminPasswordIssue('aaaaaaaaaa'), /yếu/);
  assert.match(adminPasswordIssue('test-pass'), /10/);
  assert.equal(adminPasswordIssue('moc-qua-shop-2026'), '');

  const result = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(ROOT, 'server/index.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      ADMIN_PASSWORD: 'admin',
      ADMIN_SECRET: 'not-the-password',
      DB_PATH: path.join(os.tmpdir(), 'mocqua-boot-reject.sqlite'),
      PORT: '3999',
    },
    encoding: 'utf8',
    timeout: 20000,
  });
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stderr || '', /ADMIN_PASSWORD quá yếu/);
});
