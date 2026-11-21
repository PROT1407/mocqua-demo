import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocqua-content-'));
process.env.DB_PATH = path.join(dir, 'shop.sqlite');
process.env.ADMIN_PASSWORD = 'content-test-pass';
delete process.env.CATALOG_GITHUB_TOKEN;

test('nội dung: lọc chữ, lưu, khôi phục, và trang dùng bản sửa', async () => {
  const { createApp } = await import('./index.js');
  const { getShopCatalog } = await import('./catalog.js');
  const { homePage } = await import('./pages.js');
  const {
    getSiteCopy, normalizeProductCopy, previewing, restoreContentVersion, saveProductCopy, saveSiteCopy,
  } = await import('./content.js');

  assert.throws(() => normalizeProductCopy({ name: 'a'.repeat(181) }), /quá dài/);
  assert.throws(() => normalizeProductCopy({ badge: 'Tự bịa' }), /Huy hiệu/);
  const cleaned = normalizeProductCopy({ name: 'Xoài <script>alert(1)</script> &', pitch: 'Câu ngắn mới', badge: 'Mới' });
  assert.equal(cleaned.name, 'Xoài alert(1) &');

  saveSiteCopy({ heroTitle: 'Tiêu đề thử A' });
  saveSiteCopy({ heroTitle: 'Tiêu đề thử B' });
  assert.equal(getSiteCopy().heroTitle, 'Tiêu đề thử B');
  const preview = previewing({ heroTitle: 'Xem tạm, chưa lưu' }, () => homePage(getShopCatalog()));
  assert.match(preview, /Xem tạm, chưa lưu/);
  assert.equal(getSiteCopy().heroTitle, 'Tiêu đề thử B');
  restoreContentVersion(0);
  assert.equal(getSiteCopy().heroTitle, 'Tiêu đề thử A');

  saveProductCopy('sau-rieng-say-thang-hoa-yummy', cleaned);
  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const home = await (await fetch(base + '/')).text();
    assert.match(home, /Tiêu đề thử A/);
    assert.match(home, /Bốn cách sấy/);
    const page = await (await fetch(base + '/san-pham/sau-rieng-say-thang-hoa-yummy')).text();
    assert.match(page, /Xoài alert\(1\) &amp;/);
    assert.match(page, /Câu ngắn mới/);
    assert.doesNotMatch(page, /<script>alert/);
    assert.match(page, />Mới</);
    const dm = await (await fetch(base + '/api/danh-muc')).json();
    const hit = dm.products.find((product) => product.shopId === 'sau-rieng-say-thang-hoa-yummy');
    assert.ok(hit, 'danh mục phải nối được món Yummy');
    assert.equal(hit.name, 'Xoài alert(1) &');
    assert.equal(hit.pitch, 'Câu ngắn mới');
    const live = await (await fetch(base + '/api/noi-dung')).json();
    assert.equal(live.site.heroTitle, 'Tiêu đề thử A');
    saveSiteCopy({ heroTitle: 'Tiêu đề thử A', promoText: 'Mít giảm tháng này', promoEnds: '2099-01-01' });
    const promoHome = await (await fetch(base + '/')).text();
    assert.match(promoHome, /Mít giảm tháng này/);
    assert.match(promoHome, /đến hết 01\/01\/2099/);
    const promoDm = await (await fetch(base + '/api/danh-muc')).json();
    assert.equal(promoDm.promo.text, 'Mít giảm tháng này');
    assert.equal(promoDm.promo.endsAt, '2099-01-01');
    saveSiteCopy({ heroTitle: 'Tiêu đề thử A', promoText: 'Chương trình đã hết', promoEnds: '2000-01-01' });
    const expired = await (await fetch(base + '/')).text();
    assert.doesNotMatch(expired, /Chương trình đã hết/);
  } finally {
    server.close();
  }
});
