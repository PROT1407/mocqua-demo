import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { productGallery } from '../web/js/gallery-list.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocqua-gallery-'));
process.env.DB_PATH = path.join(dir, 'shop.sqlite');
process.env.MEDIA_DIR = path.join(dir, 'media');
process.env.ADMIN_PASSWORD = 'gallery-admin-pass';
process.env.ADMIN_SECRET = 'gallery-admin-secret';
delete process.env.CATALOG_GITHUB_TOKEN;

test('mọi sản phẩm, mẫu và combo: ảnh admin khớp đúng gallery trang', async () => {
  const { adminProducts, catalogView } = await import('./catalog.js');
  const admin = adminProducts();
  assert.ok(admin.length > 100);
  let variants = 0;
  let combos = 0;
  for (const row of admin) {
    const view = catalogView(row.id);
    assert.ok(view, row.id);
    if (view.mixed) combos += 1;
    assert.equal(row.variantGalleries.length, view.variants.length, row.id);
    for (const variant of view.variants) {
      variants += 1;
      const page = productGallery(view, variant);
      const block = row.variantGalleries.find((item) => item.sku === variant.sku);
      assert.ok(block, `${row.id} ${variant.sku}`);
      assert.ok(block.items.length <= 48, `${row.id} ${variant.sku}`);
      assert.deepEqual(block.items.map((item) => item.src), page.map((item) => item.src), `${row.id} ${variant.sku}`);
      assert.deepEqual(block.items.map((item) => item.label), page.map((item) => item.kind), `${row.id} ${variant.sku}`);
    }
    const lead = view.variants.find((variant) => variant.sku === view.defaultSku) || view.variants[0];
    const leadPage = productGallery(view, lead);
    assert.deepEqual(row.gallery.map((item) => item.src), leadPage.map((item) => item.src), row.id);
    assert.deepEqual(row.gallery.map((item) => item.label), leadPage.map((item) => item.kind), row.id);
  }
  assert.ok(variants > 150);
  assert.ok(combos > 5);
  const thom = admin.find((item) => item.id === 'thom-say-deo');
  assert.deepEqual(thom.gallery.map((item) => item.label), ['Bao bì', 'Mở túi', 'Trên kệ', 'Trên kệ']);
  const xoai = admin.find((item) => item.id === 'xoai-say-thang-hoa');
  assert.ok(xoai.gallery.length > 2);
  assert.equal(xoai.gallery.filter((item) => item.label === 'Mở túi').length, 1);
  const combo = admin.find((item) => item.id === 'vz-mix-cb-ymo');
  assert.equal(combo.mixed, true);
  assert.ok(combo.gallery.length >= 3);
});

test('lưu cả danh sách thì trang khớp admin, đổi một ảnh giữ chỗ, về ảnh gốc trả lại', async () => {
  const { createApp } = await import('./index.js');
  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  try {
    const login = await fetch(base + '/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'gallery-admin-pass' }),
    });
    const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    const headers = { cookie, 'content-type': 'application/json' };
    const products = await (await fetch(base + '/api/admin/products', { headers })).json();
    const thom = products.products.find((item) => item.id === 'thom-say-deo');
    const combo = products.products.find((item) => item.id === 'vz-mix-cb-ymo');
    assert.equal(thom.gallery.length, 4);
    assert.ok(combo.gallery.length >= 3);
    const moved = [thom.gallery[2], thom.gallery[0], thom.gallery[1], thom.gallery[3]].map((item, index) => ({
      file: item.file,
      label: item.label,
      alt: item.alt,
      hero: index === 0,
    }));
    const saved = await fetch(base + '/api/admin/products/thom-say-deo/gallery', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ items: moved }),
    });
    assert.equal(saved.status, 200);
    const html = await (await fetch(base + '/san-pham/thom-say-deo')).text();
    const data = JSON.parse(html.split('id="product-data">')[1].split('</script>')[0]);
    const page = productGallery(data, data.variants.find((item) => item.sku === data.defaultSku));
    assert.deepEqual(page.map((item) => item.src), moved.map((item) => thom.gallery.find((shot) => shot.file === item.file).src));
    assert.equal(page[0].kind, 'Trên kệ');

    const replaced = await fetch(base + '/api/admin/products/thom-say-deo/photos', {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: png, replace: moved[1].file }),
    });
    const body = await replaced.json();
    assert.equal(replaced.status, 200, JSON.stringify(body));
    const after = (await (await fetch(base + '/api/admin/products', { headers })).json()).products.find((item) => item.id === 'thom-say-deo');
    assert.equal(after.gallery.length, 4);
    assert.equal(after.gallery[1].file, body.file);
    assert.equal(after.gallery[1].label, moved[1].label);
    assert.match(after.gallery[1].src, /^\/media\//);
    assert.equal(after.galleryCustom, true);

    const cleared = await fetch(base + '/api/admin/products/thom-say-deo/gallery', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ items: [] }),
    });
    assert.equal(cleared.status, 200);
    const restoredHtml = await (await fetch(base + '/san-pham/thom-say-deo')).text();
    const restored = JSON.parse(restoredHtml.split('id="product-data">')[1].split('</script>')[0]);
    assert.equal(restored.gallery, undefined);
    const again = productGallery(restored, restored.variants.find((item) => item.sku === restored.defaultSku));
    assert.deepEqual(again.map((item) => item.kind), ['Bao bì', 'Mở túi', 'Trên kệ', 'Trên kệ']);
    const adminAgain = (await (await fetch(base + '/api/admin/products', { headers })).json()).products.find((item) => item.id === 'thom-say-deo');
    assert.deepEqual(adminAgain.gallery.map((item) => item.src), again.map((item) => item.src));
    assert.equal(adminAgain.galleryCustom, false);

    const { catalogView } = await import('./catalog.js');
    const pack = catalogView('xoai-say-deo');
    const first = pack.variants[0];
    const second = pack.variants.find((variant) => productGallery(pack, variant).map((item) => item.src).join() !== productGallery(pack, first).map((item) => item.src).join());
    assert.ok(second, 'cần hai mẫu xoài có gallery khác nhau');
    const before = productGallery(pack, second).map((item) => item.src);
    const leadItems = (await (await fetch(base + '/api/admin/products', { headers })).json()).products
      .find((item) => item.id === 'xoai-say-deo').variantGalleries.find((item) => item.sku === first.sku).items
      .map((item, index) => ({ file: item.file, label: item.label, alt: index === 0 ? 'Đã sửa alt' : item.alt, hero: index === 0 }));
    const savedSku = await fetch(base + '/api/admin/products/xoai-say-deo/gallery', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ items: leadItems, skus: [first.sku] }),
    });
    assert.equal(savedSku.status, 200);
    const afterHtml = await (await fetch(base + '/san-pham/xoai-say-deo')).text();
    const pageAfter = JSON.parse(afterHtml.split('id="product-data">')[1].split('</script>')[0]);
    const show = (data, sku) => {
      const variant = data.variants.find((item) => item.sku === sku);
      const custom = data.variantGalleries?.[sku];
      const source = Array.isArray(custom) && custom.length ? { ...data, gallery: custom } : data;
      return productGallery(source, variant);
    };
    assert.equal(show(pageAfter, first.sku)[0].alt, 'Đã sửa alt');
    assert.deepEqual(show(pageAfter, second.sku).map((item) => item.src), before);
    const clearedSku = await fetch(base + '/api/admin/products/xoai-say-deo/gallery', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ items: [], skus: [first.sku] }),
    });
    assert.equal(clearedSku.status, 200);
  } finally {
    server.close();
  }
});
