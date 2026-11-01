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

test('khách xem hàng, giỏ tính chiết khấu theo đơn, VietQR, admin sửa giá và trạng thái', async () => {
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
    assert.deepEqual(one.gifts, []);
    assert.equal(one.total, one.subtotal - one.discount + one.ship);

    const two = await quote([{ sku: bag.sku, qty: 2 }]);
    assert.equal(two.subtotal, bag.price * 2);
    assert.deepEqual(two.gifts, []);
    if (two.subtotal < shop.settings.freeShip) assert.equal(two.ship, shop.settings.shipFee);
    assert.equal(two.total, two.subtotal - two.discount + two.ship);

    // Chiết khấu theo đơn: món lẻ (không combo) để kiểm từng mức.
    const { isComboProduct, orderDiscount, ORDER_TIERS } = await import('./promo.js');
    assert.deepEqual(ORDER_TIERS.map((t) => [t.min, t.pct]), [[1000000, 12], [500000, 7], [300000, 3]]);
    const single = shop.products
      .filter((p) => !isComboProduct(p) && !p.oos)
      .flatMap((p) => p.variants.filter((v) => v.price > 0 && v.price <= 60000))
      .sort((x, y) => y.price - x.price)[0];
    assert.ok(single, 'cần một món lẻ ≤ 60k');
    const qtyFor = (target) => Math.ceil(target / single.price);

    const qA = Math.floor((shop.settings.freeShip - 1) / single.price);
    const a = await quote([{ sku: single.sku, qty: qA }]);
    assert.ok(a.subtotal < shop.settings.freeShip);
    assert.equal(a.discount, 0);
    assert.equal(a.ship, shop.settings.shipFee);
    assert.equal(a.total, a.subtotal + shop.settings.shipFee);
    assert.match(a.hint, /Thêm \d[\d.]*k để được giảm 3% và miễn phí giao hàng\./);

    // Từ 300k: giảm 3% + miễn ship.
    const a3 = await quote([{ sku: single.sku, qty: qtyFor(300000) }]);
    assert.ok(a3.subtotal >= 300000 && a3.subtotal < 500000, String(a3.subtotal));
    assert.equal(a3.discountPct, 3);
    assert.equal(a3.discount, Math.floor((a3.subtotal * 3) / 100 / 1000) * 1000);
    assert.equal(a3.ship, 0);
    assert.equal(a3.total, a3.subtotal - a3.discount);
    assert.match(a3.hint, /Đơn được miễn phí giao\. Đang giảm 3%\. Thêm \d[\d.]*k để được giảm 7%/);
    assert.match(a3.discountLabel, /^Giảm 3% đơn từ 300\.000đ/);

    const b = await quote([{ sku: single.sku, qty: qtyFor(500000) }]);
    assert.ok(b.subtotal >= 500000 && b.subtotal < 1000000, String(b.subtotal));
    assert.equal(b.discountPct, 7);
    assert.equal(b.discount, Math.floor((b.subtotal * 7) / 100 / 1000) * 1000);
    assert.equal(b.ship, 0);
    assert.equal(b.total, b.subtotal - b.discount);
    assert.match(b.hint, /Thêm \d[\d.]*k để được giảm 12%/);

    const comboProduct = shop.products.find((p) => isComboProduct(p) && !p.oos && p.variants.some((v) => v.price > 0));
    const combo = comboProduct.variants.find((v) => v.price > 0);
    const c = await quote([{ sku: single.sku, qty: qtyFor(1000000 - combo.price) }, { sku: combo.sku, qty: 1 }]);
    const singlesC = c.subtotal - combo.price;
    assert.ok(c.subtotal >= 1000000);
    assert.equal(c.discountPct, 12);
    assert.equal(c.discountBase, singlesC);
    assert.equal(c.discount, Math.floor((singlesC * 12) / 100 / 1000) * 1000, 'combo không được giảm');
    assert.equal(c.total, c.subtotal - c.discount);
    assert.equal(c.items.find((i) => i.sku === combo.sku).combo, true);

    // combo kéo đơn qua mức nhưng chỉ giảm phần món lẻ
    const lift = await quote([{ sku: single.sku, qty: qtyFor(500000 - combo.price) }, { sku: combo.sku, qty: 1 }]);
    if (lift.subtotal - combo.price < 500000 && lift.subtotal < 1000000) {
      assert.equal(lift.discountPct, 7);
      assert.equal(lift.discount, Math.floor(((lift.subtotal - combo.price) * 7) / 100 / 1000) * 1000);
    }
    const onlyCombo = await quote([{ sku: combo.sku, qty: Math.ceil(500000 / combo.price) }]);
    assert.ok(onlyCombo.discountPct >= 7);
    assert.equal(onlyCombo.discount, 0);
    assert.equal(onlyCombo.ship, 0);

    // hàm thuần
    assert.deepEqual(orderDiscount([{ line: 299000 }]), { subtotal: 299000, base: 299000, comboSubtotal: 0, pct: 0, discount: 0 });
    assert.equal(orderDiscount([{ line: 300000 }]).discount, 9000);
    assert.equal(orderDiscount([{ line: 499000 }]).discount, 14000);
    assert.equal(orderDiscount([{ line: 500000 }]).discount, 35000);
    assert.equal(orderDiscount([{ line: 520000 }]).discount, 36000);
    assert.equal(orderDiscount([{ line: 999999 }]).discount, 69000);
    assert.equal(orderDiscount([{ line: 1000000 }]).discount, 120000);
    assert.equal(orderDiscount([{ line: 2500000 }]).discount, 300000, 'không có mức 2 triệu');
    assert.deepEqual(orderDiscount([{ line: 840000 }, { line: 210000, combo: true }]), { subtotal: 1050000, base: 840000, comboSubtotal: 210000, pct: 12, discount: 100000 });
    // Combo không giảm % nhưng kéo đơn qua mức 300k: chỉ món lẻ giảm 3%.
    assert.deepEqual(orderDiscount([{ line: 100000 }, { line: 239000, combo: true }]), { subtotal: 339000, base: 100000, comboSubtotal: 239000, pct: 3, discount: 3000 });
    const { bannerText, promoTiers } = await import('./promo.js');
    assert.equal(bannerText(shop.settings), 'Giảm 3% + miễn ship đơn từ 300k · Giảm 7% đơn từ 500k · Giảm 12% đơn từ 1 triệu');
    assert.deepEqual(promoTiers({ freeShip: 250000 }).map((t) => [t.min, t.pct, t.ship]), [[250000, 0, true], [300000, 3, false], [500000, 7, false], [1000000, 12, false]]);

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

    const discRes = await fetch(base + '/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items: [{ sku: single.sku, qty: qtyFor(500000) }],
        name: 'Trần Bình',
        phone: '0909123457',
        province: shop.provinces[0],
        ward: 'Phường 2',
        address: '34 đường Quả',
        pay: 'vietqr',
      }),
    });
    const discOrder = await discRes.json();
    assert.equal(discRes.status, 201, JSON.stringify(discOrder));
    assert.equal(discOrder.total, b.total);
    assert.match(discOrder.vietqr.url, new RegExp(`amount=${b.total}(&|$)`));
    const discPage = await (await fetch(base + '/don/' + discOrder.code)).text();
    assert.match(discPage, /Giảm 7% theo đơn/);

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
    const listedOrder = orders.orders.find((item) => item.code === order.code);
    assert.ok(listedOrder, 'admin phải thấy đơn vừa đặt');
    assert.equal(listedOrder.status, 'cho_ck');
    const listedDisc = orders.orders.find((item) => item.code === discOrder.code);
    assert.equal(listedDisc.summary.discountPct, 7);
    assert.equal(listedDisc.summary.discount, b.discount);

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
    assert.deepEqual(savedOrder.gifts, []);
    assert.equal(typeof savedOrder.summary.discount, 'number');
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
    assert.match(csv, /Giảm theo đơn/);
    assert.match(csv, new RegExp(`${discOrder.code}.*,Giảm,.*Giảm 7% theo đơn`));

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
    const tweaked = { ...settingsNow.settings, shipFee: settingsNow.settings.shipFee + 1000 };
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
    assert.equal(settingsBack.settings.shipFee, backup.settings.shipFee);

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

test('bảng so sánh giá: thương hiệu, nhãn, khối lượng, admin sửa và nhập/xuất', async () => {
  const { createApp } = await import('./index.js');
  const { PRICE_SEED } = await import('./price-seed.js');
  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const row of PRICE_SEED) {
      assert.ok(row.brand && row.product, 'dòng seed cần thương hiệu và sản phẩm');
      if (row.brand === 'Mộc Quả') {
        assert.equal(row.isEstimate, true, `${row.code} phải đánh dấu ước lượng`);
        assert.equal(row.price, null, `${row.code} chưa có giá thật`);
        assert.match(row.code, /^MQZ-[A-Z]+-\d+$/);
        assert.ok(row.code.endsWith('-' + row.weightG), `${row.code} khớp khối lượng`);
      } else {
        assert.match(row.sourceUrl, /^https:\/\//, `${row.product} cần link nguồn`);
        assert.match(row.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
        assert.equal(Boolean(row.isExample), false);
      }
    }
    const page = await fetch(base + '/so-sanh');
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Thương hiệu → Nhãn → Khối lượng/);
    assert.match(html, /\/static\/js\/compare\.js/);
    assert.match(html, /id="price-refs-data"/);
    assert.match(html, /href="\/so-sanh" aria-current="page"/);
    assert.equal((await fetch(base + '/static/js/compare.js')).status, 200);
    const pub = await (await fetch(base + '/api/price-refs')).json();
    assert.equal(pub.rows.length, PRICE_SEED.length);
    assert.equal(pub.rows[0].brand, 'Mộc Quả');
    assert.ok(pub.rows.some((r) => r.brand === 'Viza Food' && r.label === 'GoodGood'));
    assert.ok(pub.rows.some((r) => r.label === 'Yummy'));

    assert.equal((await fetch(base + '/api/admin/price-refs')).status, 401);
    const anon = await fetch(base + '/api/admin/price-refs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.ok(anon.status === 401 || anon.status === 403);
    const login = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'test-pass' }) });
    assert.equal(login.status, 200);
    const auth = { cookie: cookieOf(login), 'content-type': 'application/json' };
    const evil = await fetch(base + '/api/admin/price-refs', { method: 'POST', headers: { ...auth, origin: 'https://evil.example' }, body: JSON.stringify({ brand: 'X', product: 'Y' }) });
    assert.equal(evil.status, 403);

    const bad = await fetch(base + '/api/admin/price-refs', { method: 'POST', headers: auth, body: JSON.stringify({ brand: 'A', product: 'B', sourceUrl: 'javascript:alert(1)' }) });
    assert.equal(bad.status, 400);
    const created = await fetch(base + '/api/admin/price-refs', {
      method: 'POST', headers: auth,
      body: JSON.stringify({ brand: '<b>Thử</b>', label: 'Nhãn thử', product: '=SUM(A1)', fruit: 'Xoài', weightG: 200, price: null, sourceUrl: 'https://example.com/x', checkedAt: '2026-10-30', isExample: true }),
    });
    assert.equal(created.status, 201);
    const row = (await created.json()).row;
    assert.equal(row.price, null);
    assert.equal(row.isExample, true);
    const html2 = await (await fetch(base + '/so-sanh')).text();
    assert.doesNotMatch(html2, /<b>Thử<\/b>/);
    const put = await fetch(base + '/api/admin/price-refs/' + row.id, { method: 'PUT', headers: auth, body: JSON.stringify({ price: 90000 }) });
    assert.equal((await put.json()).row.price, 90000);

    const csv = await (await fetch(base + '/api/admin/price-refs.csv', { headers: { cookie: auth.cookie } })).text();
    assert.match(csv, /thuong_hieu,nhan,san_pham/);
    assert.match(csv, /'=SUM\(A1\)/);
    const json = await (await fetch(base + '/api/admin/price-refs.json', { headers: { cookie: auth.cookie } })).json();
    assert.equal(json.kind, 'mocqua-price-refs');
    const total = json.rows.length;

    const noConfirm = await fetch(base + '/api/admin/price-refs/import?mode=replace', { method: 'POST', headers: auth, body: JSON.stringify(json) });
    assert.equal(noConfirm.status, 400);
    const merged = await (await fetch(base + '/api/admin/price-refs/import?mode=merge', { method: 'POST', headers: auth, body: JSON.stringify({ csv }) })).json();
    assert.equal(merged.updated, total);
    assert.equal(merged.added, 0);
    const restored = await (await fetch(base + '/api/admin/price-refs/' + row.id, { method: 'PUT', headers: auth, body: '{}' })).json();
    assert.equal(restored.row.product, '=SUM(A1)');

    const del = await fetch(base + '/api/admin/price-refs/' + row.id, { method: 'DELETE', headers: auth });
    assert.equal(del.status, 200);
    const replaced = await (await fetch(base + '/api/admin/price-refs/import?mode=replace&confirm=THAY-HET', { method: 'POST', headers: auth, body: JSON.stringify(json) })).json();
    assert.equal(replaced.added, total);
    const after = await (await fetch(base + '/api/price-refs')).json();
    assert.equal(after.rows.length, total);
    assert.ok(after.rows.some((r) => r.id === row.id));

    const admin = await (await fetch(base + '/admin')).text();
    assert.match(admin, /data-tab="refs"/);
    assert.match(admin, /id="panel-refs"/);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('danh mục có nút thêm vào giỏ đúng mã cửa hàng; cửa hàng dùng khung ảnh 4:5', async () => {
  const { createApp } = await import('./index.js');
  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await (await fetch(base + '/danh-muc')).text();
    const raw = page.match(/<script type="application\/json" id="dm-data">([\s\S]*?)<\/script>/);
    assert.ok(raw, 'có dữ liệu danh mục');
    const data = JSON.parse(raw[1].replace(/\\u003c/g, '<'));
    assert.match(data.contact, /^https:\/\/zalo\.me\/\d+/);
    // Viza Food là đối tác phân phối độc quyền, không ghi là đối thủ / tham khảo.
    const viza = data.brands.find((b) => b.id === 'viza-food');
    assert.equal(viza.kind, 'partner');
    assert.equal(viza.kindLabel, 'Đối tác phân phối độc quyền');
    assert.match(viza.partnerNote, /đối tác phân phối độc quyền Viza Food/);
    assert.doesNotMatch(page, /Đối thủ \/ tham khảo|· tham khảo|không bán tại Mộc Quả/);
    assert.match(page, /Viza Food là đối tác phân phối độc quyền/);
    const cmpJs = await (await fetch(base + '/static/js/compare.js')).text();
    assert.match(cmpJs, /Đối tác phân phối độc quyền/);
    const buy = data.buy;
    // Mỗi lựa chọn mua phải là mã bán được, giá khớp /api/quote.
    const skus = [...new Set(Object.values(buy).flatMap((b) => b.options.map((o) => o.sku)))];
    assert.ok(skus.length > 40, 'đủ mã bán');
    for (const b of Object.values(buy)) for (const o of b.options) {
      const q = await (await fetch(base + '/api/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [{ sku: o.sku, qty: 1 }] }) })).json();
      assert.equal(q.items.length, 1, o.sku);
      assert.equal(q.items[0].price, o.price, o.sku);
    }
    // Mã trùng mã cửa hàng, mã nối tay, combo 3 Cheers+, lựa chọn 2/3 vị Premium Shrinking.
    assert.equal(buy['VZ-PS-GD-100'].sku, 'VZ-PS-GD-100');
    assert.deepEqual(buy['VZ-PS-GD-100'].options.map((o) => o.label), ['Lẻ', 'Combo 2 vị', 'Combo 3 vị']);
    assert.equal(buy['VZ-CH-XDT-200'].sku, 'MQ-DXC-200-CHA');
    assert.ok(buy['VZ-CH-XDT-200'].options.some((o) => o.sku === 'VZ-CH-CB3X-600'));
    assert.equal(buy['VZ-VZ-HDI-100'].sku, 'MQ-HDR-100-VZ');
    // Sầu riêng sấy Viza Food 100g: cùng giá túi 100g GoodGood (cùng khối lượng = cùng giá), có trên cả cửa hàng và danh mục.
    assert.equal(buy['VZ-VZ-SRS-100'].sku, 'MQ-GSR-100-VZ');
    assert.equal(buy['VZ-VZ-SRS-100'].price, buy['VZ-GG-KF-100'].price);
    assert.equal(data.products.find((p) => p.id === 'vz-vz-srs').brand, 'viza-food');
    assert.match(data.products.find((p) => p.id === 'vz-vz-srs').note, /^Lưu ý: Mẫu bao bì Viza Food này đã hết, hiện giao túi GoodGood đỏ/);
    assert.equal(data.products.find((p) => p.id === 'vz-vz-srs').images[1].src, '/assets/shelf/viza-ke-16.webp');
    // Chưa có giá hoặc chưa bán online thì không có nút mua.
    for (const code of ['VZ-GG-XDV-XX', 'VZ-FH-MITV-XX', 'VZ-FH-XDMO-XX', 'MQZ-DDY', 'VZ-GG-CARI-100']) assert.equal(buy[code], undefined, code);
    for (const p of data.products) for (const v of p.variants) if (v.price == null) assert.equal(buy[v.code], undefined, v.code);

    const shop = await (await fetch(base + '/cua-hang')).text();
    assert.match(shop, /sau-rieng-say-viza-food/);
    // Bố cục cân đối: mỗi cách sấy một lưới liền, có khối Nổi bật và 3 mức ưu đãi; món ẩn bằng cờ hide trong data.js không hiện.
    assert.match(shop, /class="feat"/);
    assert.match(shop, /class="tiers"/);
    assert.doesNotMatch(shop, /class="fhead"/);
    assert.doesNotMatch(shop, /mqz-xxx/);
    assert.equal(buy['MQZ-XXX'], undefined);
    assert.equal((await fetch(base + '/san-pham/mqz-xxx')).status, 404);
    const grids = (shop.match(/<div class="grid(?: grid--row)?">/g) || []).length;
    assert.ok(grids <= 7, 'mỗi cách sấy một lưới, có ' + grids);
    // Kiểu tạp chí: Nổi bật dạng bento có 1 ô lớn, nhóm đủ món có băng tiêu đề + "Xem tất cả" áp bộ lọc.
    // Kiểu 1 (mặc định): lưới đều, không bento/băng. Kiểu 2 (?kieu=2): bento, băng tiêu đề, "Xem tất cả" giữ kiểu.
    assert.doesNotMatch(shop, /class="gband|bento|rowmore/);
    const shop2 = await (await fetch(base + '/cua-hang?kieu=2')).text();
    assert.match(shop2, /class="grid grid--feat bento"/);
    assert.equal((shop2.match(/class="card card--hero"/g) || []).length, 1);
    assert.ok((shop2.match(/class="gband /g) || []).length >= 5);
    assert.match(shop2, /class="rowmore" href="\/cua-hang\?cat=deo&amp;kieu=2"/);
    assert.match(shop2, /href="\/cua-hang\?cat=thanghoa&amp;kieu=2"/);
    assert.match(shop2, /name="kieu" value="2"/);
    const filtered2 = await (await fetch(base + '/cua-hang?cat=deo&kieu=2')).text();
    assert.doesNotMatch(filtered2, /class="gband|grid--row|rowmore|class="feat"/);
    const filteredShop = await (await fetch(base + '/cua-hang?cat=deo')).text();
    assert.doesNotMatch(filteredShop, /class="feat"/);
    assert.doesNotMatch(filteredShop, /class="gband|grid--row|rowmore/);
    assert.match(shop, /class="card__img"[^>]*>\s*<img [^>]*loading="lazy"[^>]*width="480" height="600"/);
    const css = await (await fetch(base + '/static/css/shop.css')).text();
    assert.match(css, /\.card__img \{[^}]*aspect-ratio: 4 \/ 5/);
    const sw = await (await fetch(base + '/sw.js')).text();
    assert.match(sw, /mocqua-shell-v30/);
    assert.match(sw, /'\/static\/js\/cart-core\.js'/);
    assert.match(sw, /'\/combo'/);
    // Trang /combo: menu có link Combo, banner 1 combo nổi bật, 3 nhóm; thẻ có danh sách món, giá combo, "Tiết kiệm" tính từ giá lẻ thật, nút thêm.
    const cbp = await (await fetch(base + '/combo')).text();
    assert.match(shop, /<a href="\/combo"[^>]*>Combo<\/a>/);
    assert.match(cbp, /<a href="\/combo" aria-current="page">Combo<\/a>/);
    assert.equal((cbp.match(/class="cbhero"/g) || []).length, 1);
    for (const h of ['Ăn vặt mỗi ngày', 'Cặp đôi cùng vị', 'Quà biếu']) assert.match(cbp, new RegExp('<h2 id="cbg-[a-z-]+">' + h + '</h2>'));
    assert.doesNotMatch(cbp, /tặng 1|Mua \d+ tặng|giá gốc/i);
    const shopAll = (await import('./catalog.js')).getShopCatalog().products;
    const priceOf = new Map(shopAll.flatMap((p) => p.variants.map((v) => [v.sku, v.price])));
    const mixed = shopAll.filter((p) => p.mixed);
    assert.ok(mixed.length >= 8, 'đủ combo trộn vị');
    for (const p of mixed) {
      const sum = p.comboOf.reduce((t, sku) => t + priceOf.get(sku), 0);
      assert.ok(p.comboOf.every((sku) => priceOf.get(sku) > 0), p.id + ': món lẻ phải đang bán');
      const pct = p.comboOf.length >= 3 ? 11 : 6;
      const price = p.variants[0].price;
      assert.equal(price, Math.round((sum * (100 - pct)) / 100 / 1000) * 1000, p.id + ' giá combo');
      assert.match(cbp, new RegExp('data-add-sku="' + p.variants[0].sku + '"'));
      assert.ok(cbp.includes('Tiết kiệm ' + (sum - price) / 1000 + 'k'), p.id + ' tiết kiệm');
      // Ảnh combo hiện trọn (khung 4:5, is-45), có ảnh từng túi; có thẻ danh mục cùng mã.
      const pg = await (await fetch(base + '/san-pham/' + p.id)).text();
      assert.match(pg, /<img id="pdp-main" class="is-45" src="\/assets\/products\/vz\/[a-z0-9-]+-(?:[23]tui|anh)\.webp"/);
      assert.ok(buy[p.variants[0].sku]?.sku === p.variants[0].sku, p.id + ' có trên danh mục');
      // Không tự gắn thành lựa chọn trên thẻ lẻ ở danh mục.
      for (const b of Object.values(buy)) if (b.sku !== p.variants[0].sku) assert.ok(!b.options.some((o) => o.sku === p.variants[0].sku), p.id);
    }
    // Combo trộn vị không vào lưới cửa hàng; chỉ dải "Combo gợi ý" (3–4 thẻ) ở cả hai kiểu, khi chưa lọc.
    for (const page of [shop, shop2]) {
      assert.equal((page.match(/class="cbstrip"/g) || []).length, 1);
      const strip = page.split('class="cbstrip"')[1].split('</section>')[0];
      const n = (strip.match(/class="cbcard"/g) || []).length;
      assert.ok(n >= 3 && n <= 4, 'dải combo ' + n);
      assert.match(strip, /href="\/combo"/);
    }
    assert.doesNotMatch(filteredShop, /class="cbstrip"/);
    assert.doesNotMatch(shop.split('class="cbstrip"')[1].split('</section>').slice(1).join(''), /vz-mix-cb/);
    // Trang lẻ có trong combo: thẻ combo nhỏ (ảnh, tên, giá, mua lẻ gạch ngang, tiết kiệm, nút thêm).
    const tl = await (await fetch(base + '/san-pham/thanh-long-say-deo')).text();
    const inc = tl.split('<section class="incombo"')[1].split('</section>')[0];
    assert.match(inc, /Có trong combo/);
    assert.match(inc, /class="cbmini"[\s\S]*href="\/san-pham\/vz-gg-cb3-deo"[\s\S]*class="cbmini__save">Tiết kiệm 15k<\/span>[\s\S]*<b>120\.000đ<\/b> <span class="was">mua lẻ <s>135\.000đ<\/s><\/span>[\s\S]*data-add-sku="VZ-GG-CB3D-240"/);
    // Combo không giảm theo mức nhưng vẫn tính vào mức đơn; miễn phí giao từ 300k.
    const th = await (await fetch(base + '/api/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [{ sku: 'VZ-MIX-CB3TH-315', qty: 1 }, { sku: 'VZ-YM-CB2SR-200', qty: 1 }, { sku: 'MQ-THSR-105-YM', qty: 1 }] }) })).json();
    // 558k + 374k combo + 199k lẻ = 1.131.000đ ≥ 1 triệu: chỉ món lẻ được giảm 12%.
    assert.equal(th.subtotal, 1131000);
    assert.equal(th.discount, Math.floor((199000 * 12) / 100 / 1000) * 1000);
    assert.equal(th.ship, 0);
    // Combo Cheers 3 túi + combo 6 túi xoài: ảnh ghép đủ túi, hiện trọn; không còn ảnh/video "Mua 5 tặng 1" hay poster khuyến mãi.
    const ch3 = await (await fetch(base + '/san-pham/vz-ch-cb3x')).text();
    assert.match(ch3, /<img id="pdp-main" class="is-45" src="\/assets\/products\/vz\/vz-ch-cb3x-3tui\.webp"/);
    assert.doesNotMatch(ch3, /vz-ch-cb3x\.webp/);
    const x6 = await (await fetch(base + '/san-pham/combo-xoai-say-deo-100g')).text();
    assert.match(x6, /<img id="pdp-main" class="is-45" src="\/assets\/products\/vz\/combo-xoai-6tui\.webp"/);
    for (const f of ['combo-xoai-6tui-xanh', 'combo-xoai-6tui-tron']) assert.match(x6, new RegExp('"fit45":\\[[^\\]]*/assets/products/vz/' + f + '\\.webp'));
    assert.doesNotMatch(x6, /vzx-combo100|combo-xoai-100g/);
    assert.doesNotMatch(shop, /vzx-combo100|vz-ch-cb3x\.webp/);
    {
      const dmj = JSON.parse(fs.readFileSync(new URL('./data/danh-muc.json', import.meta.url), 'utf8'));
      const imgs = JSON.stringify((dmj.products || dmj).map((x) => x.images));
      assert.doesNotMatch(imgs, /catalog\/vz-ch-cb3x(-sm)?\.webp/);
      assert.match(imgs, /catalog\/vz-ch-cb3x-3tui\.webp/);
    }
    // Ảnh chủ shop gửi 01/11: ảnh chính của combo (hiện trọn), ảnh ghép lùi xuống ảnh phụ; 3 combo mới; Cheers 3 túi là túi tròn áo dài.
    {
      const dmj = JSON.parse(fs.readFileSync(new URL('./data/danh-muc.json', import.meta.url), 'utf8'));
      const dmp = new Map(dmj.products.map((x) => [x.id, x]));
      const want = { 'vz-gg-cb-xmx': 'vz-gg-cb2xm-anh', 'vz-ym-cb-sr': 'vz-ym-cb2sr-anh', 'vz-mix-cb-xth': 'vz-mix-cb2xt-anh', 'vz-mix-cb-msr': 'vz-mix-cb2ms-anh',
        'vz-mix-cb3-sr-xoai': 'vz-mix-cb3sx-anh', 'vz-mix-cb-ch-mit': 'vz-mix-cb2cm-anh', 'vz-mix-cb4-kita-fh': 'vz-mix-cb4kf-anh' };
      for (const [id, f] of Object.entries(want)) {
        const pg = await (await fetch(base + '/san-pham/' + id)).text();
        assert.match(pg, new RegExp('<img id="pdp-main" class="is-45" src="/assets/products/vz/' + f + '\\.webp"'), id);
        assert.equal(dmp.get(id).images[0].src, '/assets/catalog/' + f + '.webp', id);
        assert.match(cbp, new RegExp('/assets/(catalog|products/vz)/' + f + '(-sm)?\\.webp'), id + ' trên /combo');
      }
      const xmx = await (await fetch(base + '/san-pham/vz-gg-cb-xmx')).text();
      assert.match(xmx, /"photos":\[\{"src":"\/assets\/products\/vz\/vz-gg-cb2xm-anh-2\.webp"/);
      assert.match(xmx, /vz-gg-cb2xm-2tui\.webp/);
      const byId = new Map(shopAll.map((p) => [p.id, p]));
      assert.equal(byId.get('vz-mix-cb3-sr-xoai').comboOf.join(','), ['MQ-THSR-080-FH', 'MQ-DXM-200-GG', 'MQ-DXO-200-GG'].join(','));
      assert.equal(byId.get('vz-mix-cb3-sr-xoai').variants[0].price, 300000);
      assert.equal(byId.get('vz-mix-cb4-kita-fh').comboOf.join(','), ['MQ-GSR-100-KT', 'MQ-DXO-100-FHV', 'MQ-GMI-300-FH', 'MQ-DXM-100-FHR'].join(','));
      assert.equal(byId.get('vz-mix-cb4-kita-fh').variants[0].price, 241000);
      assert.equal(byId.get('vz-mix-cb-ch-mit').comboOf.join(','), ['MQ-THSR-110-CH', 'MQ-GMI-300-FH'].join(','));
      assert.equal(byId.get('vz-mix-cb-ch-mit').variants[0].price, 210000);
      for (const id of ['vz-mix-cb3-sr-xoai', 'vz-mix-cb-ch-mit']) assert.match(cbp.split('id="cbg-qua-bieu"')[1].split('</section>')[0], new RegExp('/san-pham/' + id + '"'));
      assert.match(cbp.split('id="cbg-an-vat"')[1].split('</section>')[0], /\/san-pham\/vz-mix-cb4-kita-fh"/);
      // Poster có chữ quảng cáo tiếng Anh: không làm ảnh chính ở đâu cả.
      assert.doesNotMatch(cbp, /vz-fh-mit-poster/);
      assert.doesNotMatch(ch3, /đỏ hoặc xanh lá/);
      assert.match(ch3, /túi tròn[^"<]*áo dài/);
      assert.doesNotMatch(dmp.get('vz-ch-cb3x').note, /đỏ hoặc xanh/);
      // Mít túi vàng hết bao bì: ghi chú cho khách, ảnh túi mới 200g ngay sau ảnh túi cũ; mã 300 nay đóng 200g.
      const mit = await (await fetch(base + '/san-pham/mit-say-gion')).text();
      assert.match(mit, /class="pdp__notice" role="note">Lưu ý: Mẫu bao bì vàng này đã hết, hiện giao túi Mít sấy Fresh &amp; Healthy mới, đóng gói 200g\./);
      assert.match(mit, /"photos":\[\{"src":"\/assets\/products\/fhx-mit200-moi\.webp"/);
      assert.equal(byId.get('mit-say-gion').variants.find((v) => v.sku === 'MQ-GMI-300-FH').g, 200);
      // Chủ shop đặt giá túi 200g 74k (01/11, đổi từ 65k); túi 500g giữ 139k; combo có mít tính lại theo giá mới.
      assert.equal(priceOf.get('MQ-GMI-300-FH'), 74000);
      assert.equal(priceOf.get('MQ-GMI-500-FH'), 139000);
      assert.equal(buy['VZ-FH-MIT-300'].price, 74000);
      for (const [sku, price] of [['VZ-MIX-CB2MS-400', 173000], ['VZ-MIX-CB2CM-305', 210000], ['VZ-MIX-CB4KF-500', 241000], ['VZ-MIX-CB3DG-600', 189000]]) {
        assert.equal(priceOf.get(sku), price, sku);
        assert.equal(dmj.products.flatMap((x) => x.variants).find((v) => v.code === sku).price, price, sku + ' danh mục');
      }
      for (const p of shopAll) if ((p.comboOf || []).includes('MQ-GMI-300-FH')) assert.doesNotMatch(p.short + p.long, /(85|65)\.000đ/, p.id);
      // Đợt giá xoài 01/11 (chủ shop duyệt đề xuất): F&H 250g 99k, Cheers+ 200g 89k, GG muối ớt 300g 125k, Cheers+ thăng hoa 159k. Túi vuông nhỏ MQ-DXM-S-GG: chủ shop chốt 80g, 45k (01/11, đổi từ 29k) như các túi vuông 80g khác.
      for (const [sku, price] of [['VZ-FH-XD-250', 99000], ['MQ-DXC-200-CHA', 89000], ['MQ-DXM-300-GG', 125000], ['MQ-THXO-120-CH', 159000], ['MQ-DXM-S-GG', 45000], ['VZ-CH-CB3X-600', 239000], ['VZ-FH-CB-350', 139000], ['VZ-MIX-CB3TH-315', 558000]]) assert.equal(priceOf.get(sku), price, sku);
      const dxmS = byId.get('xoai-say-deo-muoi-ot-goodgood');
      assert.deepEqual([dxmS.variants.find((v) => v.sku === 'MQ-DXM-S-GG').w, dxmS.variants.find((v) => v.sku === 'MQ-DXM-S-GG').g], ['80g', 80]);
      assert.match(dxmS.short, /túi 300g, 200g và túi vuông nhỏ 80g\./);
      assert.doesNotMatch(JSON.stringify(shopAll), /50–100g/);
      const dmv = new Map(dmj.products.flatMap((x) => x.variants).map((v) => [v.code, v.price]));
      for (const [code, price] of [['VZ-FH-XD-250', 99000], ['VZ-CH-XDL-200', 89000], ['VZ-CH-XDR-200', 89000], ['VZ-CH-XDT-200', 89000], ['MQ-DXM-300-GG', 125000], ['VZ-CH-XTH-120', 159000], ['VZ-CH-CB3X-600', 239000], ['VZ-FH-CB-350', 139000], ['VZ-MIX-CB3TH-315', 558000]]) assert.equal(dmv.get(code), price, code + ' danh mục');
      for (const [id, total, price] of [['vz-ch-cb3x', '267.000đ', '239.000đ'], ['vz-mix-cb3-thang-hoa', '627.000đ', '558.000đ']]) {
        const p = shopAll.find((x) => x.id === id);
        assert.ok(p.short.includes(price + ' (mua lẻ') && p.short.includes('= ' + total), id);
        assert.equal(p.comboOf.reduce((a, sku) => a + priceOf.get(sku), 0), Number(total.replace(/\D/g, '')), id);
      }
      assert.match(dmp.get('vz-ch-xdt').note, /Combo 2: 169\.000đ · Combo 3: 239\.000đ/);
      assert.match(dmp.get('vz-fh-xd').note, /250g: Combo 2: 185\.000đ · Combo 3: 265\.000đ/);
      assert.match(dmp.get('vz-ch-xth').note, /Combo 2: 299\.000đ · Combo 3: 425\.000đ/);
      const fm = dmp.get('vz-fh-mit');
      assert.match(fm.note, /^Lưu ý: Mẫu bao bì vàng này đã hết/);
      assert.equal(fm.images[1].src, '/assets/catalog/fhx-mit200-moi.webp');
      assert.equal(fm.variants[0].weightLabel, '200g');
    }
    // Combo Premium 3 vị: ảnh đầu là 3 túi đứng cạnh nhau, rồi từng túi; không còn ảnh kệ Cheers+ (viza-ke-02).
    const cb3 = await (await fetch(base + '/san-pham/vz-ps-cb3')).text();
    assert.match(cb3, /id="pdp-main" class="is-45" src="\/assets\/products\/vz\/vz-ps-cb3-3tui\.webp"/);
    assert.doesNotMatch(cb3, /viza-ke-02|"shelf":\{/);
    assert.match(cb3, /vz-ps-cb2-2vi\.webp/);
    assert.match(cb3, /<img id="pdp-main" class="is-45"/);
    for (const f of ['vz-ps-gd', 'vz-ps-ry', 'vz-ps-yd']) assert.match(cb3, new RegExp('"photos":\\[.*' + f + '\\.webp'));
    // Túi lẻ Premium (Golden/Royal/Yummy): ảnh túi của chính nó + ảnh 3 túi; không ảnh kệ Cheers+.
    for (const id of ['vz-ps-gd', 'vz-ps-ry', 'vz-ps-yd']) {
      const one = await (await fetch(base + '/san-pham/' + id)).text();
      assert.match(one, new RegExp('id="pdp-main" src="\\/assets\\/products\\/vz\\/' + id + '\\.webp"'));
      assert.doesNotMatch(one, /viza-ke-|"shelf":\{/);
      assert.match(one, /"photos":\[\{"src":"\/assets\/products\/vz\/vz-ps-cb3-3tui\.webp"/);
    }
    // Ảnh kệ siêu thị: chỉ gắn khi túi của chính sản phẩm nhìn thấy trên ảnh (bảng soi tay, đối chiếu MQ.SHELF_FOR).
    {
      // Bảng soi tay ảnh kệ → sản phẩm có túi đúng mã trên ảnh (cũng dùng cho 'Mua kèm' sau này).
      const BAG_ON_SHELF = JSON.parse(fs.readFileSync(new URL('./data/ke-map.json', import.meta.url), 'utf8')).shelves;
      for (let n = 1; n <= 20; n++) assert.ok(Array.isArray(BAG_ON_SHELF['viza-ke-' + String(n).padStart(2, '0')]), 'ke-map thiếu ảnh ' + n);
      const { getShopCatalog: cat } = await import('./catalog.js');
      const prods = cat().products;
      for (const p of prods) {
        for (const s of p.shelves) {
          const id = s.src.match(/(viza-ke-\d+)\.webp$/)?.[1];
          assert.ok(BAG_ON_SHELF[id]?.includes(p.id), `${p.id}: ảnh kệ ${id} không có túi của sản phẩm này`);
        }
      }
      // Ngược lại: túi có trên ảnh kệ thì trang đó phải có ảnh kệ ấy.
      const byId = new Map(prods.map((p) => [p.id, p]));
      for (const [id, ids] of Object.entries(BAG_ON_SHELF)) {
        for (const pid of ids) assert.ok(byId.get(pid)?.shelves.some((s) => s.src.endsWith(id + '.webp')), `${pid} thiếu ảnh kệ ${id}`);
      }
      for (const id of ['vz-ps-gd', 'vz-ps-ry', 'vz-ps-yd', 'vz-ps-cb3', 'vz-hat-macca-say', 'vz-fh-cb350', 'xoai-say-deo-goodgood', 'xoai-say-thang-hoa', 'vz-ch-cb3x', 'vz-fh-xd']) {
        assert.equal(byId.get(id).shelves.length, 0, id + ' không có túi trên ảnh kệ nào');
      }
      // Nhiều mẫu túi: ảnh kệ chỉ hiện ở mẫu có túi đó (cùng luật với web/js/product.js gallery()).
      const bagOn = (s, v) => !s.bags || s.bags.some((k) => [v.img, v.back].some((x) => x && new RegExp('/' + k + '[-.]').test(x)));
      const shelvesFor = (pid, sku) => { const p = byId.get(pid); const v = p.variants.find((x) => x.sku === sku); assert.ok(v, sku); return p.shelves.filter((s) => bagOn(s, v)).map((s) => s.src.match(/viza-ke-\d+/)[0]).join(','); };
      for (const p of prods) for (const s of p.shelves) assert.ok(p.variants.some((v) => bagOn(s, v)), `${p.id}: ${s.src} không khớp mẫu túi nào`);
      assert.equal(shelvesFor('xoai-say-deo', 'MQ-DXO-200-FHX'), '', 'xoài F&H túi xanh lá – trắng chưa có ảnh kệ đúng túi');
      assert.equal(shelvesFor('xoai-say-deo', 'MQ-DXO-100-FHH'), '');
      assert.equal(shelvesFor('xoai-say-deo', 'MQ-DXO-200-FHT'), 'viza-ke-15,viza-ke-17,viza-ke-07,viza-ke-08,viza-ke-04,viza-ke-06,viza-ke-01');
      assert.equal(shelvesFor('xoai-say-deo', 'MQ-DXO-100-FHG'), 'viza-ke-18');
      assert.equal(shelvesFor('xoai-say-deo-muoi-ot', 'MQ-DXM-500-FH'), '');
      assert.equal(shelvesFor('xoai-say-deo-muoi-ot-goodgood', 'MQ-DXM-200-GG'), '');
      assert.equal(shelvesFor('xoai-say-deo-muoi-ot-goodgood', 'MQ-DXM-S-GG'), 'viza-ke-14,viza-ke-18');
      assert.equal(shelvesFor('mit-say-gion', 'MQ-GMI-300-FH'), 'viza-ke-20');
      assert.equal(shelvesFor('xoai-chin-cay', 'MQ-DXC-250-CHD'), '');
      // Thơm GoodGood: gói vuông trắng-vàng trên kệ là cùng sản phẩm (chủ shop xác nhận), ảnh bao bì chính giữ nguyên.
      assert.equal(shelvesFor('thom-say-deo', 'MQ-DTH-080-GG'), 'viza-ke-14,viza-ke-18');
      assert.ok(!byId.get('vz-fh-cb350').shelves.length && !byId.get('xoai-say-deo').shelves.some((s) => s.src.includes('viza-ke-05')));
      // Ảnh cận cảnh rõ túi nhất đứng đầu nhóm "Trên kệ".
      const first = (pid) => byId.get(pid).shelves[0]?.src.match(/viza-ke-\d+/)[0];
      assert.equal(first('xoai-say-deo-muoi-ot'), 'viza-ke-13');
      assert.equal(first('sau-rieng-say-goodgood'), 'viza-ke-16');
      assert.equal(first('sau-rieng-say-kita'), 'viza-ke-20');
      // Trang xoài muối ớt F&H: Bao bì → Mở túi → Trên kệ (cận cảnh ke-13 trước), ảnh kệ hiện trọn khung.
      const fhr = await (await fetch(base + '/san-pham/xoai-say-deo-muoi-ot?sku=MQ-DXM-200-FHR')).text();
      assert.match(fhr, /"open":\{"src":"\/assets\/products\/real\/xoai-deo-muoi-ot\.webp"/);
      assert.match(fhr, /"shelves":\[\{"src":"\/assets\/shelf\/viza-ke-13\.webp"[^\]]*\]/);
      assert.match(fhr, /"fit45":\["\/assets\/shelf\/viza-ke-13\.webp"/);
      // Thanh long: túi "Dragon Fruit Dried" Viza Food trên ke-12 là cùng sản phẩm (chủ shop xác nhận), ảnh bao bì chính giữ nguyên.
      const tl = await (await fetch(base + '/san-pham/thanh-long-say-deo')).text();
      assert.match(tl, /id="pdp-main" src="\/assets\/products\/tl080/);
      assert.equal(shelvesFor('thanh-long-say-deo', 'MQ-DTL-080-GG'), 'viza-ke-12');
      // Sầu riêng sấy nhãn riêng Viza Food 100g (túi cam – vàng): ảnh túi cắt từ ke-10 trước, rồi ke-10, ke-11 "Trên kệ".
      const vzsr = await (await fetch(base + '/san-pham/sau-rieng-say-viza-food')).text();
      assert.match(vzsr, /id="pdp-main"[^>]* src="\/assets\/products\/vz\/vz-vz-srs-100-45\.jpg"/);
      assert.equal(shelvesFor('sau-rieng-say-viza-food', 'MQ-GSR-100-VZ'), 'viza-ke-10,viza-ke-11');
      // Túi Viza Food đã hết: ghi chú cho khách + ảnh túi GoodGood đỏ đang giao ngay sau ảnh túi Viza.
      assert.match(vzsr, /class="pdp__notice" role="note">Lưu ý: Mẫu bao bì Viza Food này đã hết, hiện giao túi GoodGood đỏ cùng loại, cùng 100g\./);
      assert.match(vzsr, /"photos":\[\{"src":"\/assets\/shelf\/viza-ke-16\.webp","kind":"Túi GoodGood đỏ \(đang giao\)"/);
      assert.doesNotMatch(await (await fetch(base + '/san-pham/sau-rieng-say-goodgood')).text(), /pdp__notice/);
      const xd = await (await fetch(base + '/san-pham/xoai-say-deo')).text();
      assert.match(xd, /"fit45":\["\/assets\/shelf\/viza-ke-20\.webp"/);
    }
    // Cửa hàng có thì danh mục cũng có: mọi mã đang bán ở /cua-hang đều có thẻ danh mục (trùng mã, nối tay hoặc lựa chọn combo).
    // Riêng túi vuông nhỏ 80g MQ-DXM-S-GG (45k) chưa có thẻ danh mục (danh mục chỉ có túi cam 100g/200g/300g).
    const { getShopCatalog } = await import('./catalog.js');
    const reach = new Set(Object.values(buy).flatMap((b) => [b.sku, ...b.options.map((o) => o.sku)]));
    const missing = getShopCatalog().products.flatMap((p) => p.variants.map((v) => v.sku)).filter((sku) => !reach.has(sku) && sku !== 'MQ-DXM-S-GG');
    assert.equal(missing.join(','), '', 'mã cửa hàng chưa có trên danh mục');
    assert.ok(data.categories.some((c) => c.id === 'omai') && data.categories.some((c) => c.id === 'set'));
    assert.ok(data.products.filter((p) => p.brand === 'moc-qua').length >= 70);
    assert.equal(buy['VZ-FH-XDH-100'].sku, 'MQ-DXO-100-FHH');
    assert.equal(buy['VZ-FH-XDV-100'].sku, 'MQ-DXO-100-FHV');
    assert.deepEqual(buy['VZ-FH-XD-100'].options.find((o) => o.sku === 'MQ-CBX-100-FH')?.label, 'Combo 6 túi');
    assert.equal(buy['MQ-DXO-150-VZ'].oos, true);
    assert.equal(buy['MQ-DXO-150-VZ'].options.length, 0);
    const dmJs = await (await fetch(base + '/static/js/danh-muc.js')).text();
    assert.match(dmJs, /Hết hàng/);
  } finally {
    server.close();
  }
});

test('combo: tiết kiệm từ giá lẻ thật, gợi ý đổi/thêm combo trong giỏ, thanh miễn ship', async () => {
  const { createApp } = await import('./index.js');
  const { getShopCatalog } = await import('./catalog.js');
  const { comboDeals, matchDeal, cartNudges, shipBar } = await import('./deals.js');
  const { applyNudge } = await import('../web/js/cart-core.js');
  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const quote = async (items) => (await fetch(base + '/api/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items }) })).json();
  try {
    const catalog = getShopCatalog();
    const priceOf = new Map(catalog.products.flatMap((p) => p.variants.map((v) => [v.sku, v.price])));
    const deals = comboDeals(catalog);
    // 1) Tiết kiệm = tổng giá lẻ hiện tại − giá combo; không có combo "tiết kiệm" 0 hay âm.
    assert.ok(deals.length >= 20);
    for (const d of deals) {
      assert.equal(d.sum, d.slots.reduce((t, sl) => t + priceOf.get(sl.ref), 0), d.sku);
      assert.equal(d.save, d.sum - d.price, d.sku);
      assert.ok(d.save > 0 && d.price === priceOf.get(d.sku), d.sku);
    }
    const by = new Map(deals.map((d) => [d.sku, d]));
    assert.deepEqual([by.get('VZ-CH-CB3X-600').sum, by.get('VZ-CH-CB3X-600').save], [267000, 28000]);
    assert.deepEqual([by.get('VZ-FH-CB-350').sum, by.get('VZ-FH-CB-350').save], [148000, 9000]);
    assert.deepEqual([by.get('VZ-MIX-CB3TH-315').sum, by.get('VZ-MIX-CB3TH-315').save], [627000, 69000]);
    assert.deepEqual([by.get('MQ-CBX-100-GG').sum, by.get('MQ-CBX-100-GG').save], [294000, 35000]);
    // Combo 2 vị khách tự chọn (không rõ món) không có số tiết kiệm.
    assert.ok(!by.has('VZ-PS-CB2-200'));

    // 2) Hiển thị: nhãn trên ảnh + "mua lẻ" gạch ngang đúng tổng lẻ, ở /combo, dải combo (2 kiểu), danh mục, trang combo.
    const cbp = await (await fetch(base + '/combo')).text();
    assert.match(cbp, /class="savebadge">Tiết kiệm 28k<\/span><\/a>/);
    assert.match(cbp, /<b>239\.000đ<\/b><span class="was">mua lẻ <s>267\.000đ<\/s><\/span>/);
    assert.match(cbp, /class="cbhero__img"[^]*?class="savebadge savebadge--lg">Tiết kiệm \d+k<\/span>/);
    assert.doesNotMatch(cbp, /giá gốc|tặng 1|Mua \d+ tặng/i);
    for (const u of ['/cua-hang', '/cua-hang?kieu=2']) {
      const page = await (await fetch(base + u)).text();
      const strip = page.split('class="cbstrip"')[1].split('</section>')[0];
      const n = (strip.match(/class="cbcard"/g) || []).length;
      assert.equal((strip.match(/class="savebadge">Tiết kiệm \d+k<\/span>/g) || []).length, n, u);
      assert.equal((strip.match(/<span class="was">mua lẻ <s>[\d.]+đ<\/s><\/span>/g) || []).length, n, u);
    }
    const dm = await (await fetch(base + '/danh-muc')).text();
    const dmData = JSON.parse(dm.split('<script type="application/json" id="dm-data">')[1].split('</script>')[0]);
    assert.deepEqual(dmData.deals['VZ-CH-CB3X-600'], { sum: 267000, save: 28000 });
    const pg = await (await fetch(base + '/san-pham/vz-ch-cb3x')).text();
    assert.match(pg, /id="pdp-save" hidden/);
    const pd = JSON.parse(pg.split('<script type="application/json" id="product-data">')[1].split('</script>')[0]);
    assert.deepEqual(pd.deals['VZ-CH-CB3X-600'], { sum: 267000, save: 28000 });

    // 3) applyNudge: bớt đúng số món lẻ, thêm 1 combo, giữ món khác, gộp combo đã có.
    assert.deepEqual(applyNudge([{ sku: 'A', qty: 2 }, { sku: 'B', qty: 1 }, { sku: 'C', qty: 1 }], { sku: 'CB', remove: [{ sku: 'A', qty: 1 }, { sku: 'B', qty: 1 }] }),
      [{ sku: 'A', qty: 1 }, { sku: 'C', qty: 1 }, { sku: 'CB', qty: 1 }]);
    assert.deepEqual(applyNudge([{ sku: 'CB', qty: 1 }, { sku: 'A', qty: 3 }], { sku: 'CB', remove: [{ sku: 'A', qty: 3 }] }), [{ sku: 'CB', qty: 2 }]);
    // Mã cùng sản phẩm, cùng cỡ, cùng giá (khác màu túi) được ghép vào combo.
    const m = matchDeal(by.get('MQ-CBX-100-FH'), new Map([['MQ-DXO-100-FHG', 4], ['MQ-DXO-100-FHH', 1]]));
    assert.equal(m.missing.length, 1);
    assert.deepEqual([...m.used.entries()].sort(), [['MQ-DXO-100-FHG', 4], ['MQ-DXO-100-FHH', 1]]);
    // Hàm thuần: đủ món → "swap"; thiếu 1 → "add"; tiết kiệm lấy từ totalOf.
    const flat = (list) => list.reduce((t, it) => t + priceOf.get(it.sku) * it.qty, 0);
    const n3 = cartNudges([{ sku: 'MQ-DXC-200-CHA', qty: 3 }], deals, flat);
    assert.equal(n3[0].kind, 'swap'); assert.equal(n3[0].sku, 'VZ-CH-CB3X-600'); assert.equal(n3[0].save, 28000);
    const n2 = cartNudges([{ sku: 'MQ-DXC-200-CHA', qty: 2 }], deals, flat);
    assert.equal(n2[0].kind, 'add'); assert.equal(n2[0].addSku, 'MQ-DXC-200-CHA'); assert.equal(n2[0].save, 28000);
    assert.deepEqual(cartNudges([{ sku: 'MQ-DXC-200-CHA', qty: 1 }], deals, flat).filter((n) => n.sku === 'VZ-CH-CB3X-600'), []);

    // 4) /api/quote: gợi ý + đổi xong tổng giảm đúng số đã báo; combo không bị giảm % nhưng vẫn tính vào mức đơn.
    const ch3 = [{ sku: 'MQ-DXC-200-CHA', qty: 3 }];
    const q3 = await quote(ch3);
    assert.equal(q3.nudges[0].kind, 'swap');
    assert.equal(q3.nudges[0].save, 28000);
    const q3b = await quote(applyNudge(ch3, q3.nudges[0]));
    assert.deepEqual(q3b.items.map((i) => [i.sku, i.qty]), [['VZ-CH-CB3X-600', 1]]);
    assert.equal(q3b.total, q3.total - 28000);
    assert.ok(!q3b.nudges.some((n) => n.sku === 'VZ-CH-CB3X-600'));
    // Thiếu 1 túi: "thêm" → so với mua lẻ thêm túi đó, combo rẻ hơn đúng số báo.
    const mit = [{ sku: 'MQ-GMI-300-FH', qty: 1 }];
    const qm = await quote(mit);
    const add = qm.nudges[0];
    assert.equal(add.kind, 'add');
    const lẻ = await quote([...mit, { sku: add.addSku, qty: 1 }]);
    const ghép = await quote(applyNudge(mit, add));
    assert.equal(lẻ.total - ghép.total, add.save);
    assert.ok(ghép.items.every((i) => i.sku === add.sku));
    // Đơn lớn có món lẻ khác: đổi sang combo vẫn tính đúng mức giảm (tính cả phần lẻ còn lại).
    const big = [{ sku: 'MQ-DXC-200-CHA', qty: 3 }, { sku: 'MQ-THSR-105-YM', qty: 4 }];
    const qb = await quote(big);
    for (const n of qb.nudges.filter((x) => x.kind === 'swap')) {
      const after = await quote(applyNudge(big, n));
      assert.equal(after.total, qb.total - n.save, n.sku);
      assert.equal(after.discount, Math.floor((after.discountBase * after.discountPct) / 100 / 1000) * 1000);
    }
    // Đổi làm rớt mức 12% → không gợi ý. 3 Cheers + 15 túi 100g = 1.002.000đ; đổi xong 974.000đ chỉ còn giảm 7%.
    const edge = [{ sku: 'MQ-DXC-200-CHA', qty: 3 }, { sku: 'MQ-DXO-100-GG', qty: 15 }];
    const qe = await quote(edge);
    assert.equal(qe.subtotal, 1002000);
    assert.ok(!qe.nudges.some((n) => n.sku === 'VZ-CH-CB3X-600'), 'không gợi ý khi đổi làm tăng tổng');
    for (const n of qe.nudges) assert.ok(n.save > 0);
    // Không bao giờ gợi ý đổi/ghép làm rớt mức % hay mất miễn ship, kể cả khi tổng có rẻ hơn.
    const ch = [{ sku: 'MQ-DXC-200-CHA', qty: 3 }];
    const isNow = (list) => list.length === 1 && list[0].sku === 'MQ-DXC-200-CHA' && list[0].qty === 3;
    const cheaper = (list) => (isNow(list) ? 500000 : 400000);
    assert.ok(cartNudges(ch, deals, cheaper).some((n) => n.sku === 'VZ-CH-CB3X-600'));
    assert.ok(!cartNudges(ch, deals, cheaper, { levelOf: (list) => ({ pct: isNow(list) ? 7 : 3, freeShip: true }) }).some((n) => n.sku === 'VZ-CH-CB3X-600'), 'rớt mức %');
    assert.ok(!cartNudges(ch, deals, cheaper, { levelOf: (list) => ({ pct: 3, freeShip: isNow(list) }) }).some((n) => n.sku === 'VZ-CH-CB3X-600'), 'mất miễn ship');
    assert.ok(cartNudges(ch, deals, cheaper, { levelOf: () => ({ pct: 7, freeShip: true }) }).some((n) => n.sku === 'VZ-CH-CB3X-600'));
    // Giỏ thật quanh các mức: mọi gợi ý giữ nguyên hoặc tăng mức %, và tổng giảm đúng số báo.
    for (const extra of [0, 6, 7, 14, 15]) {
      const cart = [{ sku: 'MQ-DXC-200-CHA', qty: 3 }, ...(extra ? [{ sku: 'MQ-DXO-100-GG', qty: extra }] : [])];
      const q0 = await quote(cart);
      for (const n of q0.nudges.filter((x) => x.kind === 'swap')) {
        const q1 = await quote(applyNudge(cart, n));
        assert.ok(q1.discountPct >= q0.discountPct && (q0.ship > 0 || q1.ship === 0), `${extra}: ${n.sku}`);
        assert.equal(q1.total, q0.total - n.save);
      }
    }
    // Giỏ chỉ có combo: không gợi ý.
    assert.deepEqual((await quote([{ sku: 'VZ-CH-CB3X-600', qty: 1 }])).nudges, []);

    // 5) Thanh miễn ship: còn thiếu bao nhiêu + 1 món/combo vừa đủ (≥ khoảng thiếu, không có sẵn trong giỏ).
    assert.equal(q3.shipBar.need, 300000 - 267000);
    assert.ok(q3.shipBar.suggest.price >= q3.shipBar.need);
    assert.doesNotMatch(q3.cartHint, /miễn phí giao/);
    const qFree = await quote([{ sku: 'VZ-MIX-CB3TH-315', qty: 1 }]);
    assert.deepEqual([qFree.shipBar.need, qFree.shipBar.pct, qFree.shipBar.suggest], [0, 100, null]);
    assert.equal(shipBar(0, 300000), null);
    const sb = shipBar(255000, 300000, { deals, singles: [{ sku: 'S1', price: 39000 }, { sku: 'S2', price: 49000 }, { sku: 'S3', price: 45000 }] });
    assert.equal(sb.need, 45000); assert.equal(sb.suggest.sku, 'S3');
    // Không gợi ý thứ đã có trong giỏ.
    assert.equal(shipBar(255000, 300000, { singles: [{ sku: 'S3', price: 45000 }, { sku: 'S2', price: 49000 }], inCart: new Set(['S3']) }).suggest.sku, 'S2');
    // Giỏ (client) có câu gợi ý đổi combo và thanh miễn ship.
    const cartJs = await (await fetch(base + '/static/js/cart.js')).text();
    assert.match(cartJs, /Đổi sang combo, tiết kiệm/);
    assert.match(cartJs, /nữa được \$\{perk\}/);
    assert.match(cartJs, /giảm \$\{bar\.withPct\}% \+ miễn ship/);
    assert.equal(q3.shipBar.withPct, 3);
  } finally {
    server.close();
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
