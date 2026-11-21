import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, test } from 'node:test';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocqua-seo-'));
process.env.DB_PATH = path.join(dir, 'shop.sqlite');
process.env.ADMIN_PASSWORD = 'seo-test-pass';
delete process.env.SITE_URL;

function graphs(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((match) => {
    const data = JSON.parse(match[1]);
    return data['@graph'] || [data];
  });
}

function typesOf(node) {
  const value = node?.['@type'];
  return Array.isArray(value) ? value : [value];
}

describe('seo', { concurrency: 1 }, () => {
test('robots mở trang bán, sitemap và JSON-LD đúng giá danh mục', async () => {
  process.env.SEO_INDEXING = 'on';
  const { createApp } = await import('./index.js');
  const { getShopCatalog } = await import('./catalog.js');
  const { homeSeo, PAGE_SEO, shopSeo } = await import('./seo.js');
  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const robots = await (await fetch(base + '/robots.txt')).text();
    assert.match(robots, /^User-agent: \*/m);
    assert.match(robots, /^Allow: \/$/m);
    assert.match(robots, /^Disallow: \/admin$/m);
    assert.match(robots, /^Disallow: \/gio-hang$/m);
    assert.match(robots, /^Disallow: \/api\/$/m);
    assert.match(robots, /^Sitemap: https:\/\/mocqua\.onrender\.com\/sitemap\.xml$/m);
    assert.equal(robots.split('\n').some((line) => line.trim() === 'Disallow: /'), false);

    const mapRes = await fetch(base + '/sitemap.xml');
    assert.match(mapRes.headers.get('content-type') || '', /xml/);
    const xml = await mapRes.text();
    for (const path of ['/', '/cua-hang', '/combo', '/danh-muc', '/hop-qua', '/so-sanh', '/cua-hang?cat=thanghoa', '/san-pham/sau-rieng-say-thang-hoa-yummy']) {
      assert.match(xml, new RegExp(`<loc>https://mocqua\\.onrender\\.com${path.replace(/[/?]/g, '\\$&')}</loc>`));
    }
    assert.match(xml, /<lastmod>2026-11-07<\/lastmod>/);
    assert.doesNotMatch(xml, /mqz-xxx|ca-phe/);

    const home = await (await fetch(base + '/')).text();
    assert.match(home, new RegExp(`<title>${homeSeo().title}</title>`));
    assert.ok(homeSeo().title.length <= 70, homeSeo().title);
    assert.ok(homeSeo().description.length <= 155);
    assert.match(home, /rel="canonical" href="https:\/\/mocqua\.onrender\.com\/"/);
    assert.match(home, /property="og:title"/);
    assert.match(home, /property="og:image" content="https:\/\/mocqua\.onrender\.com\/assets\/products\/real\/xoai-deo-muoi-ot\.webp"/);
    assert.match(home, /name="twitter:card" content="summary_large_image"/);
    assert.match(home, /name="robots" content="index, follow"/);
    assert.equal(homeResHeaders(await fetch(base + '/')).get('x-robots-tag'), null);
    const homeLd = graphs(home);
    assert.ok(homeLd.some((node) => typesOf(node).includes('Organization')));
    assert.ok(homeLd.some((node) => typesOf(node).includes('Store')));
    assert.ok(homeLd.some((node) => typesOf(node).includes('WebSite')));
    assert.match(home, /376\/15 Nguyễn Đình Chiểu/);
    assert.doesNotMatch(homeSeo().title + homeSeo().description, /Ri6/i);

    const shop = await (await fetch(base + '/cua-hang?cat=thanghoa')).text();
    assert.match(shop, new RegExp(`<title>${shopSeo('thanghoa').title}</title>`));
    assert.match(shop, /canonical" href="https:\/\/mocqua\.onrender\.com\/cua-hang\?cat=thanghoa"/);
    const combo = await (await fetch(base + '/combo')).text();
    assert.match(combo, new RegExp(`<title>${PAGE_SEO.combo.title}</title>`));
    for (const copy of [shopSeo(''), shopSeo('deo'), shopSeo('gion'), ...Object.values(PAGE_SEO)]) {
      assert.ok(copy.title.length <= 65, copy.title);
      assert.ok(copy.description.length <= 155, copy.description + ' ' + copy.description.length);
      assert.doesNotMatch(copy.title + copy.description, /Ri6/i);
    }

    const catalog = getShopCatalog();
    const yummy = catalog.products.find((product) => product.id === 'sau-rieng-say-thang-hoa-yummy');
    const lead = yummy.variants.find((variant) => variant.sku === yummy.defaultSku);
    const page = await (await fetch(base + '/san-pham/' + yummy.id)).text();
    assert.match(page, /property="og:type" content="product"/);
    assert.match(page, new RegExp(`property="og:image" content="https://mocqua\\.onrender\\.com${yummy.cardImg}"`));
    assert.match(page, /property="product:price:amount" content="\d+"/);
    assert.match(page, /property="product:price:currency" content="VND"/);
    assert.match(page, /<details><summary>/);
    const nodes = graphs(page);
    const productLd = nodes.find((node) => node['@type'] === 'Product');
    assert.equal(productLd.offers.price, lead.price);
    assert.equal(productLd.offers.priceCurrency, 'VND');
    assert.equal(productLd.offers.availability, 'https://schema.org/InStock');
    assert.equal(productLd.sku, lead.sku);
    assert.equal(productLd.brand.name, yummy.brandName);
    assert.ok(nodes.some((node) => node['@type'] === 'BreadcrumbList'));
    assert.ok(nodes.some((node) => node['@type'] === 'FAQPage'));
    assert.doesNotMatch(page, /aggregateRating/);
    assert.doesNotMatch(productLd.name + productLd.description, /Ri6/i);
    const thumbs = await (await fetch(base + '/static/js/product.js')).text();
    assert.match(thumbs, /alt="\$\{text\(image\.alt \|\| data\.name\)\}"/);
    assert.doesNotMatch(thumbs, /alt=""/);
  } finally {
    server.close();
  }
});

function homeResHeaders(res) {
  return res.headers;
}

test('SITE_URL đổi địa chỉ trong sitemap', async () => {
  process.env.SEO_INDEXING = 'on';
  process.env.SITE_URL = 'https://mocqua.com/';
  const { robotsTxt, siteUrl } = await import('./seo.js');
  assert.equal(siteUrl(), 'https://mocqua.com');
  assert.match(robotsTxt(), /Sitemap: https:\/\/mocqua\.com\/sitemap\.xml/);
  delete process.env.SITE_URL;
});

test('SEO_INDEXING tắt thì chặn Google, thẻ chia sẻ vẫn còn', async () => {
  for (const value of [undefined, '', 'off', 'yes', '0']) {
    if (value === undefined) delete process.env.SEO_INDEXING;
    else process.env.SEO_INDEXING = value;
    const { indexingEnabled, robotsTxt, headTags } = await import('./seo.js');
    assert.equal(indexingEnabled(), false, String(value));
    assert.equal(robotsTxt(), 'User-agent: *\nDisallow: /\n');
    assert.doesNotMatch(robotsTxt(), /Sitemap|Allow:/);
    const tags = headTags({ title: 'Mộc Quả', description: 'Trái cây sấy', path: '/', type: 'product', price: 199000 });
    assert.match(tags, /name="robots" content="noindex, nofollow"/);
    assert.match(tags, /rel="canonical"/);
    assert.match(tags, /property="og:title"/);
    assert.match(tags, /property="og:type" content="product"/);
    assert.match(tags, /product:price:amount" content="199000"/);
  }
  for (const value of ['on', 'true', '1', 'ON', 'True']) {
    process.env.SEO_INDEXING = value;
    const { indexingEnabled } = await import('./seo.js');
    assert.equal(indexingEnabled(), true, value);
  }
  delete process.env.SEO_INDEXING;
  const { createApp } = await import('./index.js');
  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const robots = await fetch(base + '/robots.txt');
    assert.equal(await robots.text(), 'User-agent: *\nDisallow: /\n');
    assert.equal(robots.headers.get('x-robots-tag'), 'noindex, nofollow');
    const home = await fetch(base + '/');
    const html = await home.text();
    assert.equal(home.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.match(html, /rel="canonical" href="https:\/\/mocqua\.onrender\.com\/"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /application\/ld\+json/);
    const health = await fetch(base + '/healthz');
    assert.equal(health.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal((await fetch(base + '/sitemap.xml')).status, 200);
  } finally {
    server.close();
    process.env.SEO_INDEXING = 'on';
  }
});
});
